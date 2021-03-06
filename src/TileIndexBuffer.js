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

/** 
	@constructor TileIndexBuffer
	TileIndexBuffer
 */
GlobWeb.TileIndexBuffer = function( renderContext, config )
{
	this.renderContext = renderContext;
	this.config = config;
	this.solidIndexBuffer = null;
	this.subSolidIndexBuffer = [ null, null, null, null ];
	this.wireframeIndexBuffer = null;
	this.subWireframeIndexBuffer = [ null, null, null, null ];
	this.subIndices = [ null, null, null, null ];
}

/**************************************************************************************************************/

/**  
 * Reset the index buffers.
 */
GlobWeb.TileIndexBuffer.prototype.reset = function()
{	
	var gl = this.renderContext.gl;
	for ( var i=0; i < 4; i++ )
	{
		if ( this.subSolidIndexBuffer[i] )
		{
			gl.deleteBuffer( this.subSolidIndexBuffer[i] );
			this.subSolidIndexBuffer[i] = null;
		}
	}
	if ( this.solidIndexBuffer )
	{
		gl.deleteBuffer( this.solidIndexBuffer );
		this.solidIndexBuffer = null;
	}
	for ( var i=0; i < 4; i++ )
	{
		if ( this.subWireframeIndexBuffer[i] )
		{
			gl.deleteBuffer( this.subWireframeIndexBuffer[i] );
			this.subWireframeIndexBuffer[i] = null;
		}
	}
	if ( this.wireframeIndexBuffer )
	{
		gl.deleteBuffer( this.wireframeIndexBuffer );
		this.wireframeIndexBuffer = null;
	}
}

/**************************************************************************************************************/

/**
 *	Get index buffer for sub solid
 */
GlobWeb.TileIndexBuffer.prototype.getSubSolid = function(ii)
{
	if ( this.subSolidIndexBuffer[ii] == null )
	{
		var i = ii % 2;
		var j = Math.floor( ii / 2 );
		
		var size = this.config.tesselation;
		var halfTesselation = (size-1) / 2;
		
		// Build the sub grid for 'inside' tile
		var indices = [];
		for ( var n=halfTesselation*j; n < halfTesselation*(j+1); n++)
		{
			for ( var k=halfTesselation*i; k < halfTesselation*(i+1); k++)
			{
				indices.push( n * size + k );
				indices.push( (n+1) * size + k );
				indices.push( n * size + k + 1 );
				
				indices.push( n * size + k + 1 );
				indices.push( (n+1) * size + k );
				indices.push( (n+1) * size + k + 1 );
			}
		}
		
		this.subIndices[ii] = indices;

		if (this.config.skirt)
		{
			// Build skirts
			// Top skirt
			var start = (j == 0) ? size * size : size * size + 4 * size;
			var src = (j == 0) ? 0 : halfTesselation * size;
			for ( var n = halfTesselation*i; n < halfTesselation*(i+1); n++)
			{
				indices.push( start + n );
				indices.push( src + n );
				indices.push( start + n + 1 );
				
				indices.push( start + n + 1 );
				indices.push( src + n );
				indices.push( src + n + 1 );
			}
		
			// Bottom skirt
			start = (j == 0) ? size * size + 4 * size : size * size + size;
			src = (j == 0) ? halfTesselation * size : (size-1) * size;
			for ( var n = halfTesselation*i; n < halfTesselation*(i+1); n++)
			{
				indices.push( src + n );
				indices.push( start + n );
				indices.push( src + n + 1 );
				
				indices.push( src + n + 1 );
				indices.push( start + n );
				indices.push( start + n + 1 );
			}
				
			// Left skirt
			start = (i == 0) ? size * size + 2 * size : size * size + 5 * size;
			src = (i == 0) ? 0 : halfTesselation;
			for ( var k=halfTesselation*j; k < halfTesselation*(j+1); k++)
			{
				indices.push( start + k );
				indices.push( start + k + 1 );
				indices.push( src + k * size );
				
				indices.push( src + k * size );
				indices.push( start + k + 1);
				indices.push( src + (k+1) * size );
			}
			
			// Right skirt
			start = (i == 0) ? size * size + 5 * size : size * size + 3 * size;
			src = (i == 0) ? halfTesselation : size - 1;
			for ( var k=halfTesselation*j; k < halfTesselation*(j+1); k++)
			{
				indices.push( k * size + src );
				indices.push( (k+1) * size + src );
				indices.push( start + k );
				
				indices.push( start + k );
				indices.push( (k+1) * size + src );
				indices.push( start + k + 1 );
			}
		}
		
		var gl = this.renderContext.gl;
		var ib = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		ib.numIndices = indices.length;
		this.subSolidIndexBuffer[ii] = ib;
	}
	
	return this.subSolidIndexBuffer[ii];
}

/**************************************************************************************************************/

/**
 *	Get index buffer for sub wireframe
 */
GlobWeb.TileIndexBuffer.prototype.getSubWireframe = function(ii)
{
	if ( this.subWireframeIndexBuffer[ii] == null )
	{
		var i = ii % 2;
		var j = Math.floor( ii / 2 );
		
		var size = this.config.tesselation;
		var halfTesselation = (size-1) / 2;
		
		// Build the sub grid for 'inside' tile
		var indices = [];
		for ( var n=halfTesselation*j; n < halfTesselation*(j+1)+1; n++)
		{
			for ( var k=halfTesselation*i; k < halfTesselation*(i+1); k++)
			{
				indices.push( n * size + k );
				indices.push( n * size + k + 1 );
			}
		}
		for ( var n=halfTesselation*i; n < halfTesselation*(i+1)+1; n++)
		{
			for ( var k=halfTesselation*j; k < halfTesselation*(j+1); k++)
			{
				indices.push( k * size + n );
				indices.push( (k+1) * size + n );
			}
		}
	
		var gl = this.renderContext.gl;
		var ib = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		ib.numIndices = indices.length;
		this.subWireframeIndexBuffer[ii] = ib;
	}
	
	return this.subWireframeIndexBuffer[ii];
}

/**************************************************************************************************************/

/*
	Build index buffer
 */
GlobWeb.TileIndexBuffer.prototype.getSolid = function()
{
	if ( this.solidIndexBuffer == null )
	{
		var size = this.config.tesselation;
		var indices = [];
		// Build the grid
		for ( var j=0; j < size-1; j++)
		{
			for ( var i=0; i < size-1; i++)
			{
				indices.push( j * size + i );
				indices.push( (j+1) * size + i );
				indices.push( j * size + i + 1 );
				
				indices.push( j * size + i + 1 );
				indices.push( (j+1) * size + i );
				indices.push( (j+1) * size + i + 1 );
			}
		}
		
		if (this.config.skirt)
		{
			// Top skirt
			var start = size * size;
			for ( var i = 0; i < size-1; i++)
			{
				indices.push( start + i );
				indices.push( i );
				indices.push( start + i + 1 );
				
				indices.push( start + i + 1 );
				indices.push( i );
				indices.push( i + 1 );
			}
			
			// Bottom skirt
			start += size;
			for ( var i=0; i < size-1; i++)
			{
				indices.push( (size-1) * size + i );
				indices.push( start + i );
				indices.push( (size-1) * size + i + 1 );
				
				indices.push( (size-1) * size + i + 1 );
				indices.push( start + i );
				indices.push( start + i + 1 );
			}
				
			// Left skirt
			start += size;
			for ( var j=0; j < size-1; j++)
			{
				indices.push( start + j );
				indices.push( start + j + 1 );
				indices.push( j * size );
				
				indices.push( j * size );
				indices.push( start + j + 1);
				indices.push( (j+1) * size );
			}

			// Right skirt
			start += size;
			for ( var j=0; j < size-1; j++)
			{
				indices.push( j * size + size - 1 );
				indices.push( (j+1) * size + size - 1 );
				indices.push( start + j );
				
				indices.push( start + j );
				indices.push( (j+1) * size + size - 1 );
				indices.push( start + j + 1 );
			}
		}
		
		var gl = this.renderContext.gl;
		var ib = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		this.numIndices = indices.length;
		
		this.solidIndexBuffer = ib;
		this.solidIndexBuffer.numIndices = indices.length;
	}
	
	return this.solidIndexBuffer;
}

/**************************************************************************************************************/

/*
	Build index buffer
 */
GlobWeb.TileIndexBuffer.prototype.getWireframe = function()
{
	if ( this.wireframeIndexBuffer == null )
	{
		var size = this.config.tesselation;
		var indices = [];
		
		// Build horizontal lines
		for ( var j=0; j < size; j++)
		{
			for ( var i=0; i < size-1; i++)
			{
				indices.push( j * size + i );
				indices.push( j * size + i + 1 );
			}
		}

		// Build vertical lines
		for ( var j=0; j < size; j++)
		{
			for ( var i=0; i < size-1; i++)
			{
				indices.push( i * size + j );
				indices.push( (i+1) * size + j );
			}
		}

		
		var gl = this.renderContext.gl;
		var ib = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		this.numIndices = indices.length;
		
		ib.numIndices = indices.length;
		this.wireframeIndexBuffer = ib;
	}
	
	return this.wireframeIndexBuffer;
}

/**************************************************************************************************************/
