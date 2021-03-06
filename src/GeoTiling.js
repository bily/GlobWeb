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
	GeoTiling constructor
 */
GlobWeb.GeoTiling = function(nx,ny)
{
	this.level0NumTilesX = nx;
	this.level0NumTilesY = ny;
}

/**************************************************************************************************************/

/** 
	Generate the tiles for level zero
 */
GlobWeb.GeoTiling.prototype.generateLevelZeroTiles = function(config)
{	
	config.skirt = 1;
	config.cullSign = 1;

	var level0Tiles = [];
	
	var latStep = 180 / this.level0NumTilesY;
	var lonStep = 360 / this.level0NumTilesX;
	
	for (var j = 0; j < this.level0NumTilesY; j++)
	{
		for (var i = 0; i < this.level0NumTilesX; i++)
		{
			var geoBound = new GlobWeb.GeoBound( -180 + i * lonStep, -90 + j * latStep, -180 + (i+1) * lonStep, -90 + (j+1) * latStep  );
			var tile = new GlobWeb.GeoTile(geoBound)
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
GlobWeb.GeoTiling.prototype.lonlat2LevelZeroIndex = function(lon,lat)
{	
	var i = Math.floor( (lon + 180) * this.level0NumTilesX / 360 );
 	var j = Math.floor( (lat + 90) * this.level0NumTilesY / 180 );
	return j * this.level0NumTilesX + i;

}

/**************************************************************************************************************/

/** @constructor
	Tile constructor
 */
GlobWeb.GeoTile = function( geoBound )
{
    // Call ancestor constructor
    GlobWeb.Tile.prototype.constructor.call(this);
	
	this.geoBound = geoBound;
}

/**************************************************************************************************************/

/** inherits from GlobWeb.Tile */
GlobWeb.GeoTile.prototype = new GlobWeb.Tile;

/**************************************************************************************************************/

/** @export
  Get elevation at a geo position
*/
GlobWeb.GeoTile.prototype.getElevation = function(lon,lat)
{
	// Get the lon/lat in coordinates between [0,1] in the tile
	var u = (lon - this.geoBound.west) / (this.geoBound.east - this.geoBound.west);
 	var v = (lat - this.geoBound.north) / (this.geoBound.south - this.geoBound.north);

	// Quick fix when lat is on the border of the tile
	var childIndex = (v >= 1 ? 1 : Math.floor(2*v) )*2 + Math.floor(2*u);
	if ( this.children && this.children[childIndex].state == GlobWeb.Tile.State.LOADED )
		return this.children[childIndex].getElevation(lon,lat);
	
	var tess = this.config.tesselation;
	var i = Math.floor( u * tess );
	var j = Math.floor( v * tess );
	
	var vo = this.config.vertexSize * (j * tess + i);
	var vertex = [ this.vertices[vo], this.vertices[vo+1], this.vertices[vo+2] ];
	mat4.multiplyVec3( this.matrix, vertex );
	var geo = GlobWeb.CoordinateSystem.from3DToGeo(vertex);
	return geo[2];
}

/**************************************************************************************************************/

/*
	Create the children
 */
GlobWeb.GeoTile.prototype.createChildren = function()
{
	// Create the children
	var lonCenter = ( this.geoBound.east + this.geoBound.west ) * 0.5;
	var latCenter = ( this.geoBound.north + this.geoBound.south ) * 0.5;
	
	var tile00 = new GlobWeb.GeoTile( new GlobWeb.GeoBound( this.geoBound.west, latCenter, lonCenter, this.geoBound.north ) );
	var tile10 = new GlobWeb.GeoTile( new GlobWeb.GeoBound( lonCenter, latCenter,  this.geoBound.east, this.geoBound.north ) );
	var tile01 = new GlobWeb.GeoTile( new GlobWeb.GeoBound( this.geoBound.west, this.geoBound.south, lonCenter, latCenter ) );
	var tile11 = new GlobWeb.GeoTile( new GlobWeb.GeoBound( lonCenter, this.geoBound.south, this.geoBound.east, latCenter ) );
	
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
GlobWeb.GeoTile.prototype.generateVertices = function(elevations)
{	
	// Compute tile matrix
	this.matrix = GlobWeb.CoordinateSystem.getLHVTransform( this.geoBound.getCenter() );
	var invMatrix = mat4.create();
	mat4.inverse( this.matrix, invMatrix );
	this.inverseMatrix = invMatrix;
	
	// Build the vertices
	var vertexSize = this.config.vertexSize;
	var size = this.config.tesselation;
	var vertices = new Float32Array( vertexSize*size*(size+6) );
	var lonStep = (this.geoBound.east - this.geoBound.west) / (size-1);
	var latStep = (this.geoBound.south - this.geoBound.north) / (size-1);
	var radius = GlobWeb.CoordinateSystem.radius;
	var scale = GlobWeb.CoordinateSystem.heightScale;
	var offset = 0;
	
	var lat = this.geoBound.north * Math.PI / 180.0;
	latStep = latStep * Math.PI / 180.0;
	lonStep = lonStep * Math.PI / 180.0;
	for ( var j=0; j < size; j++)
	{
		var cosLat = Math.cos( lat );
		var sinLat = Math.sin( lat );
		
		var lon = this.geoBound.west * Math.PI / 180.0;
				
		for ( var i=0; i < size; i++)
		{
			var height = elevations ? scale * elevations[ offset ] : 0.0;
			
			var x = (radius + height) * Math.cos( lon ) * cosLat;
			var y = (radius + height) * Math.sin( lon ) * cosLat;
			var z = (radius + height) * sinLat;
			
			var vi = offset * vertexSize;
			vertices[vi] = invMatrix[0]*x + invMatrix[4]*y + invMatrix[8]*z + invMatrix[12];
			vertices[vi+1] = invMatrix[1]*x + invMatrix[5]*y + invMatrix[9]*z + invMatrix[13];
			vertices[vi+2] = invMatrix[2]*x + invMatrix[6]*y + invMatrix[10]*z + invMatrix[14];
						
			offset++;
			lon += lonStep;
		}
		
		lat += latStep;
	}
	
	return vertices;
}

/**************************************************************************************************************/
