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
 
/**************************************************************************************************************/


/** @export
	@constructor
	WMSLayer constructor
 */
GlobWeb.WMSLayer = function( options )
{
	GlobWeb.RasterLayer.prototype.constructor.call( this, options );
	
	this.baseUrl = options['baseUrl'];
	this.tilePixelSize = options['tilePixelSize'] || 256;
	this.tiling = new GlobWeb.GeoTiling( 4, 2 );
	this.numberOfLevels = options['numberOfLevels'] || 21;
	this.type = "ImageryRaster";
	
	// Build the base GetMap URL
	var url = this.baseUrl;
	if ( url.indexOf('?',0) == -1 )
	{
		url += '?service=wms';
	}
	else
	{
		url += '&service=wms';
	}
	url += "&version="
	url += options.hasOwnProperty('version') ? options['version'] : '1.1.1';
	url += "&request=GetMap";
	url += "&srs=";
	url += options.hasOwnProperty('srs') ? options['srs'] : 'EPSG:4326';
	url += "&layers=" + options['layers'];
	if ( options.hasOwnProperty('styles') )
	{
		url += "&styles=" + options.styles;
	}
	url += "&format=";
	url += options.hasOwnProperty('format') ? options['format'] : 'image/jpeg';
	if ( options.hasOwnProperty('transparent') )
	{
		url += "&transparent=" + options.transparent;
	}
	url += "&width=";
	url += this.tilePixelSize;
	url += "&height=";
	url += this.tilePixelSize;
	if ( options.hasOwnProperty('time') )
	{
		url += "&time=" + options.time;
	}
	
	this.getMapBaseUrl = url;
}

/**************************************************************************************************************/

GlobWeb.inherits(GlobWeb.RasterLayer,GlobWeb.WMSLayer);

/**************************************************************************************************************/

/**
	Get an url for the given tile
 */
GlobWeb.WMSLayer.prototype.getUrl = function(tile)
{
	// Just add the bounding box to the GetMap URL
	var geoBound = tile.geoBound;
	var url = this.getMapBaseUrl;
	url += "&bbox=";
	
	url += geoBound.west;
	url += ",";
	url += geoBound.south;
	url += ",";
	url += geoBound.east;
	url += ",";
	url += geoBound.north;

//	console.log(url);
	
	return url;
}

/**************************************************************************************************************/
