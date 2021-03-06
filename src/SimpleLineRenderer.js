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

/** @constructor
 *	SimpleLineRenderer constructor
 */

GlobWeb.SimpleLineRenderer = function(tileManager)
{
	this.renderContext = tileManager.renderContext;
	
	// Renderables
	this.shapes = [];
	
	var vertexShader = "\
	attribute vec3 vertex;\n\
	uniform mat4 viewProjectionMatrix;\n\
	\n\
	void main(void)\n\
	{\n\
		gl_Position = viewProjectionMatrix * vec4(vertex, 1.0);\n\
	}\n\
	";
	
	var fragmentShader = "\
	#ifdef GL_ES \n\
	precision highp float; \n\
	#endif \n\
	uniform vec4 color; \n\
	\n\
	void main(void) \n\
	{ \n\
		gl_FragColor = color; \n\
	} \n\
	";
	
	this.program = new GlobWeb.Program(this.renderContext);
	this.program.createFromSource(vertexShader, fragmentShader);
}

/**************************************************************************************************************/

/**
 *	Add line shape to renderer
 */
GlobWeb.SimpleLineRenderer.prototype.addFeature = function(feature, style){
	
	// Create renderable
	var shape = {
		mesh : null,
		feature : feature,
		style : style
	}
	
	shape.mesh = new GlobWeb.Mesh(this.renderContext);
	
	// Fill array by line shape coordinates
	var vertices = [];
	for ( var i=0; i<feature['geometry']['coordinates'].length; i+=3)
	{
		vertices = vertices.concat([ feature['geometry']['coordinates'][i], feature['geometry']['coordinates'][i+1], feature['geometry']['coordinates'][i+2] ]);
	}
	
	// Compute the indices corresponding to line shape
	var indices = [];
	for ( var i=0; i<feature['geometry']['coordinates'].length/3 - 1; i++ )
	{
		indices.push(i);
		indices.push(i+1);
	}
	// Connect last point with the first one
	indices.push(i);
	indices.push(0);
	
	shape.mesh.setVertices(vertices);
	shape.mesh.setIndices(indices);
	shape.mesh.mode = this.renderContext.gl.LINES;
	
	// Add to renderables
	this.shapes.push(shape);
}

/**************************************************************************************************************/

/**
 * 	Remove line shape from renderer
 */
GlobWeb.SimpleLineRenderer.prototype.removeFeature = function(feature){
	
	for ( var i = 0; i<this.shapes.length; i++ )
	{
		var currentShape = this.shapes[i];
		if ( currentShape.feature == feature){
			this.shapes.splice(i, 1);
		}
	}
}

/**************************************************************************************************************/

/**
 * 	Render all the lines
 */
GlobWeb.SimpleLineRenderer.prototype.render = function(){
	var renderContext = this.renderContext;
	var gl = renderContext.gl;

	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);

	this.program.apply();

	// The shader only needs the viewProjection matrix, use GlobWeb.modelViewMatrix as a temporary storage
	mat4.multiply(renderContext.projectionMatrix, renderContext.viewMatrix, renderContext.modelViewMatrix)
	gl.uniformMatrix4fv(this.program.uniforms["viewProjectionMatrix"], false, renderContext.modelViewMatrix);
	
	for ( var n = 0; n < this.shapes.length; n++ )
	{
		// opacity HACK
		gl.uniform4f(this.program.uniforms["color"], 0.03125 , 0.23046875, 0.65625, this.shapes[n].style.opacity / 2);
		this.shapes[n].mesh.render(this.program.attributes);
	}
	
	gl.enable(gl.DEPTH_TEST);
	gl.disable(gl.BLEND);
}


/**************************************************************************************************************/

// Register the renderer
GlobWeb.VectorRendererManager.registerRenderer({
	creator: function(globe) { 
			return new GlobWeb.SimpleLineRenderer(globe.tileManager);
		},
	canApply: function(type,style) {return type == "SimpleLineCollection"; }
});