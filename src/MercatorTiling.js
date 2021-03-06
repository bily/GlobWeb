/***************************************
 * Copyright 2011, 2012 GlobWeb contributors.
 *
 * This file is part of GlobWeb.
 *
 * GlobWeb is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, version 3 of the License, or
 * (at your option) any later version.
 *
 * GlobWeb is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GlobWeb. If not, see <http://www.gnu.org/licenses/>.
 ***************************************/

/** @constructor
	MercatorTiling constructor
 */
GlobWeb.MercatorTiling = function(startLevel)
{
	this.startLevel = startLevel;
}

/**************************************************************************************************************/

/** 
	Generate the tiles for level zero
 */
GlobWeb.MercatorTiling.prototype.generateLevelZeroTiles = function(config)
{
	config.skirt = true;
	config.cullSign = 1;
	
	var level0Tiles = [];
	
	var level0NumTilesX = Math.pow(2,this.startLevel);
	var level0NumTilesY = Math.pow(2,this.startLevel);
	
	for (var j = 0; j < level0NumTilesY; j++)
	{
		for (var i = 0; i < level0NumTilesX; i++)
		{
			var tile = new GlobWeb.MercatorTile( this.startLevel, i, j );
			tile.config = config;
			level0Tiles.push( tile );
		}
	}

	return level0Tiles;
}

/**************************************************************************************************************/

/** 
	Locate a level zero tile
 */
GlobWeb.MercatorTiling.prototype.lonlat2LevelZeroIndex = function(lon,lat)
{	
	return 0;
}

/**************************************************************************************************************/

GlobWeb.MercatorTiling.tile2long = function(x,z) {
	return ( x /Math.pow(2,z) * 360 - 180 );
}

GlobWeb.MercatorTiling.tile2lat = function(y,z) {
	var n = Math.PI - 2 * Math.PI * y / Math.pow(2,z);
	return ( 180 / Math.PI * Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}		

/**************************************************************************************************************/

/** @constructor
	Tile constructor
 */
GlobWeb.MercatorTile = function( level, x, y )
{
    // Call ancestor constructor
    GlobWeb.Tile.prototype.constructor.call(this);
	
	this.level = level;
	this.x = x;
	this.y = y;
	
	this.geoBound = new GlobWeb.GeoBound( GlobWeb.MercatorTiling.tile2long(x,level), GlobWeb.MercatorTiling.tile2lat(y+1,level), GlobWeb.MercatorTiling.tile2long(x+1,level), GlobWeb.MercatorTiling.tile2lat(y,level) );
}

/**************************************************************************************************************/

/** Inhertis from tile */
GlobWeb.MercatorTile.prototype = new GlobWeb.Tile;

/**************************************************************************************************************/

/** @export
  Get elevation at a geo position
*/
GlobWeb.MercatorTile.prototype.getElevation = function(lon,lat)
{
	return 0.0;
}

/**************************************************************************************************************/

/*
	Create the children
 */
GlobWeb.MercatorTile.prototype.createChildren = function()
{
	// Create the children
	var tile00 = new GlobWeb.MercatorTile( this.level+1, 2*this.x, 2*this.y );
	var tile10 = new GlobWeb.MercatorTile( this.level+1, 2*this.x+1, 2*this.y );
	var tile01 = new GlobWeb.MercatorTile( this.level+1, 2*this.x, 2*this.y+1 );
	var tile11 = new GlobWeb.MercatorTile( this.level+1, 2*this.x+1, 2*this.y+1 );
	
	tile00.initFromParent( this, 0, 0 );
	tile10.initFromParent( this, 1, 0 );
	tile01.initFromParent( this, 0, 1 );
	tile11.initFromParent( this, 1, 1 );
	
	this.children = [ tile00, tile10, tile01, tile11 ];	
}


/**************************************************************************************************************/

/*
	Generate vertices for tile
 */
GlobWeb.MercatorTile.prototype.generateVertices = function(elevations)
{	 
	// Compute tile matrix
	this.matrix = GlobWeb.CoordinateSystem.getLHVTransform( this.geoBound.getCenter() );
	var invMatrix = mat4.create();
	mat4.inverse( this.matrix, invMatrix );
	this.inverseMatrix = invMatrix;

	// Build the vertices
	var size = this.config.tesselation;
	var vertices = new Float32Array( 3*size*(size+6) );
	var step = 1.0 / (size-1);
	var radius = GlobWeb.CoordinateSystem.radius;
	var scale = GlobWeb.CoordinateSystem.heightScale;
	var offset = 0;
	
	var twoPowLevel = Math.pow(2,this.level);
	
	var v = this.y;
	for ( var j=0; j < size; j++)
	{
		var n = Math.PI * (1.0  - 2.0 * v / twoPowLevel);
		var lat = Math.atan( 0.5 * (Math.exp(n) - Math.exp(-n)) );
	
		var cosLat = Math.cos( lat );
		var sinLat = Math.sin( lat );
		
		var u = this.x;
				
		for ( var i=0; i < size; i++)
		{
			var lon = Math.PI * ( 2.0 * u / twoPowLevel - 1.0 );
			var height = elevations ? scale * elevations[ offset ] : 0.0;
			
			var x = (radius + height) * Math.cos( lon ) * cosLat;
			var y = (radius + height) * Math.sin( lon ) * cosLat;
			var z = (radius + height) * sinLat;
			
			var vertexOffset = offset * 3;
			vertices[vertexOffset] = invMatrix[0]*x + invMatrix[4]*y + invMatrix[8]*z + invMatrix[12];
			vertices[vertexOffset+1] = invMatrix[1]*x + invMatrix[5]*y + invMatrix[9]*z + invMatrix[13];
			vertices[vertexOffset+2] = invMatrix[2]*x + invMatrix[6]*y + invMatrix[10]*z + invMatrix[14];
						
			offset++;
			u += step;
		}
		
		v += step;
	}
	
	return vertices;
}

/**************************************************************************************************************/
