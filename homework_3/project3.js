// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project3.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	let sin = Math.sin;
	let cos = Math.cos;

	let rot_XM = Array(1, 0,        0,       0, 
                       0, cos(rotationX),  sin(rotationX), 0, 
                       0, -sin(rotationX), cos(rotationX), 0, 
                       0, 0,        0,       1); 

	let rot_YM = Array(cos(rotationY), 0, -sin(rotationY), 0, 
                       0,       1, 0,        0, 
                       sin(rotationY), 0, cos(rotationY),  0, 
                       0,       0, 0,        1);

	let translation_matrix = [1,            0,            0,            0,
		                      0,            1,            0,            0,
		                      0,            0,            1,            0,
		                      translationX, translationY, translationZ, 1];

    let rotation_matrix = MatrixMult(rot_YM, rot_XM);
    let transformation_matrix = MatrixMult(translation_matrix, rotation_matrix);
    return MatrixMult(projectionMatrix, transformation_matrix);
}




class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		this.prog = InitShaderProgram(this.vertex_shader, this.fragment_shader);
        gl.useProgram(this.prog);
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.flip_YZ = gl.getUniformLocation(this.prog, 'flip_YZ');
        gl.uniform1i(this.flipYZ, document.getElementById('swap-yz').checked ? 1 : 0);
        this.show_texture = gl.getUniformLocation(this.prog, 'show_texture');
        gl.uniform1i(this.show_texture, document.getElementById('show-texture').checked ? 1 : 0);
		this.vertex = gl.getAttribLocation(this.prog, 'vertex');
        this.vertex_buffer = gl.createBuffer();
        this.texture_coordinates = gl.getAttribLocation(this.prog, 'texture_coordinates');
        this.texture_coordinates_buffer = gl.createBuffer();
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		gl.useProgram(this.prog);
        const req_length = Math.floor(vertPos.length * 2 / 3);
        if (texCoords.length !== req_length) {
            texCoords = new Array(req_length);
        }
        this.setBuffer(gl.ARRAY_BUFFER, this.texture_coordinates_buffer, texCoords);
        this.setBuffer(gl.ARRAY_BUFFER, this.vertex_buffer, vertPos);
        this.num_triangles = vertPos.length / 3;
	}

    setBuffer(target, buffer, data) {
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, new Float32Array(data), gl.STATIC_DRAW);
    }
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ(swap) {
        this.useProgramAndSetUniform(() => {
            gl.uniform1i(this.flip_YZ, swap ? 1 : 0);
        });
    }
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
        this.useProgramAndSetupAttributes(() => {
            gl.uniformMatrix4fv(this.mvp, false, trans);
            gl.drawArrays(gl.TRIANGLES, 0, this.num_triangles);
        });
    }
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
        this.useProgram(() => {
            const texture = gl.createTexture();
            const mipmaplvl = 0;

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, mipmaplvl, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
    
            let sampler = gl.getUniformLocation(this.prog, 'texture');
            gl.uniform1i(sampler, 0);
        });
    }

	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture(show) {
        this.useProgram(() => {
            gl.uniform1i(this.show_texture, show ? 1 : 0);
        });
    }
    
    useProgramAndSetUniform(callback) {
        gl.useProgram(this.prog);
        callback();
    }
    
    useProgramAndSetupAttributes(callback) {
        gl.useProgram(this.prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texture_coordinates_buffer);
        gl.vertexAttribPointer(this.texture_coordinates, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texture_coordinates);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
        gl.vertexAttribPointer(this.vertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vertex);
        callback();
    }
    
    useProgram(callback) {
        gl.useProgram(this.prog);
        callback();
    }
    
    
    // Vertex Shader GLSL
   vertex_shader = `
        uniform int flip_YZ;
        uniform bool show_texture;
        uniform mat4 mvp;
        attribute vec2 texture_coordinates;
        attribute vec3 vertex;
        varying vec2 uv_coordinate;
        void main()
        {
            vec4 v = vec4(vertex, 1.0);
            if(flip_YZ == 1){ 
                v = vec4(v.x, v.z, v.y, v.w); 
            }
            gl_Position = mvp * v;
            if(show_texture){ 
                uv_coordinate = texture_coordinates; 
            }
        }
    `;
    
    // Fragment Shader GLSL
   fragment_shader = `
        precision highp int;
        precision highp float;
        uniform bool show_texture;
        uniform sampler2D texture;
        varying vec2 uv_coordinate;
        void main()
        {
            vec4 color;
            if(show_texture){ 
                color = texture2D(texture, uv_coordinate); 
            }
            else{
              float ndc_depth  = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) / (gl_DepthRange.far - gl_DepthRange.near);
              float clip_depth = ndc_depth / gl_FragCoord.w;
              float c          = (clip_depth * 0.5) + 0.5;
              color = vec4(c*c*c, 0.0, c*c*c, 1.0);
            }

            gl_FragColor = color;
        }
    `;
}