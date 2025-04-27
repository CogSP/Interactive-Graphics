// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1];
	var mat_rotation_x = [
		1, 0, 0, 0,
		0, Math.cos(rotationX), Math.sin(rotationX), 0,
		0, -Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1];
	var mat_rotation_y= [
		Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
		0, 1, 0, 0,
		Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1];
	var result=MatrixMult(MatrixMult(trans, mat_rotation_x), mat_rotation_y);
	return result;
}


class MeshDrawer
{
	constructor()
	{
		// Compile the shader program
		this.prog = InitShaderProgram(this.vertex_shader, this.fragment_shader);
        gl.useProgram(this.prog);
		
		// Model-view projection pointers
        this.mv = gl.getUniformLocation(this.prog, 'mv');
		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.mvn = gl.getUniformLocation(this.prog, 'mvn');

        // Pointer to the light direction, set default light direction
        this.light = gl.getUniformLocation(this.prog, 'light');
        this.light_direction = Array(1,1,1);
        gl.uniform3fv(this.light, this.light_direction);
        
        // Pointer to the shininess value
        this.shininess = gl.getUniformLocation(this.prog, 'shininess');
        this.alpha = document.getElementById('shininess-exp').value;
        gl.uniform1f(this.shininess, this.alpha);

        // Initialize the the flipYZ to the identity matrix
        this.flip_YZ = gl.getUniformLocation(this.prog, 'flip_YZ');
        let flip_YZ_transform = document.getElementById('swap-yz').checked;
        flip_YZ_transform = flip_YZ_transform ? this.yz_flip_matrix : this.identity_matrix;
        gl.uniformMatrix4fv(this.flip_YZ, false, flip_YZ_transform);

        // Initialize if we show the texture
        this.show_texture = gl.getUniformLocation(this.prog, 'show_texture');
        let checked = document.getElementById('show-texture').checked ? 1 : 0;
        gl.uniform1i(this.show_texture, checked);

		// Get the ids of the vertex attributes in the shaders
		this.vertex = gl.getAttribLocation(this.prog, 'vertex');
        this.vertex_buffer = gl.createBuffer();

        // Pointer to the texture coordinates
        this.texture_coordinates = gl.getAttribLocation(this.prog, 'texture_coordinates');
        this.texture_coordinates_buffer = gl.createBuffer();

        // Pointer to the normals
        this.normal = gl.getAttribLocation(this.prog, 'normal');
        this.normal_buffer = gl.createBuffer();
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setAttributeBuffer(buffer, data, attribute, size) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribute);
    }

    setMesh(vertPos, texCoords, normals) {
        gl.useProgram(this.prog);

        this.setAttributeBuffer(this.texture_coordinates_buffer, texCoords, this.texture_coordinates, 2);
        this.setAttributeBuffer(this.normal_buffer, normals, this.normal, 3);
        this.setAttributeBuffer(this.vertex_buffer, vertPos, this.vertex, 3);

        this.numTriangles = vertPos.length / 3;
    }
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ(swap){
        gl.useProgram(this.prog);
        let matrix = swap ? this.yz_flip_matrix : this.identity_matrix;
		gl.uniformMatrix4fv(this.flip_YZ, false, matrix);
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	setBufferAttributes(buffer, attribute, size, type, stride, offset) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(attribute, size, type, false, stride, offset);
        gl.enableVertexAttribArray(attribute);
    }

    draw(matrixMVP, matrixMV, matrixNormal) {
        gl.useProgram(this.prog);

        this.setBufferAttributes(this.texture_coordinates_buffer, this.texture_coordinates, 2, gl.FLOAT, 0, 0);
        this.setBufferAttributes(this.normal_buffer, this.normal, 3, gl.FLOAT, 0, 0);
        this.setBufferAttributes(this.vertex_buffer, this.vertex, 3, gl.FLOAT, 0, 0);

        gl.uniformMatrix4fv(this.mv, false, matrixMV);
        gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
        gl.uniformMatrix3fv(this.mvn, false, matrixNormal);

        gl.uniform3fv(this.light, this.light_direction);

        this.camera_v = Array(matrixMV[0], matrixMV[5], matrixMV[10], matrixMV[15]);
        gl.uniform4fv(this.camera, this.camera_v);

        gl.uniform1f(this.shininess, this.alpha);

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img)
	{
        gl.useProgram(this.prog);

        // Create the texture
        const texture = gl.createTexture();
        const mipmaplvl = 0;

        gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, mipmaplvl, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        // Activate the 0th Texture Unit and Bind our texture to it
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(gl.getUniformLocation(this.prog, 'texture'), 0);
	}

	showTexture(show)
	{
        gl.useProgram(this.prog);

        if (show) { gl.uniform1i(this.show_texture, 1); }
        else { gl.uniform1i(this.show_texture, 0); }
	}
	
	// This method is called to set the incoming light direction
    // This is the omega term, it points *at* the light 
    // This is *ambiguous* in the project notes, and was very confusing!
	setLightDir(x, y, z) { 
		this.light_direction = Array(x,y,z); 
	}
	
	// This method is called to set the shininess of the material
	setShininess(shininess) { 
		this.alpha = shininess; 
	}

    // Convenience matrices
    identity_matrix = Array(1,0,0,0,  0,1,0,0,  0,0,1,0,  0,0,0,1);
    yz_flip_matrix  = Array(1,0,0,0,  0,0,1,0,  0,1,0,0,  0,0,0,1);

    // Vertex Shader GLSL
   vertex_shader = `
        uniform mat4 mv;
        uniform mat4 mvp;
        uniform mat4 flip_YZ;
        uniform mat3 mvn;
        uniform bool show_texture;
        attribute vec2 texture_coordinates;
        attribute vec3 normal;
        attribute vec3 vertex;
        varying vec2 textureCoord;
        varying vec3 new_normal;
        varying vec4 point;
        void main()
        {
            vec4 v = vec4(vertex, 1);
            gl_Position = mvp * flip_YZ * v;
            new_normal = mvn * mat3(flip_YZ) * normal;
            point      = mv  *      flip_YZ  * v;
            if(show_texture){ 
                textureCoord = texture_coordinates; 
            }
        }
    `;
    
    // Fragment Shader GLSL
   fragment_shader = `
        precision highp int;
        precision mediump float;
        uniform bool show_texture;
        uniform float shininess;
        uniform vec3 light; 
        uniform sampler2D texture;
        varying vec2 textureCoord;
        varying vec3 new_normal;
        varying vec4 point;
        void main()
        {
            vec4 light_color = vec4(1.0, 1.0, 1.0, 1.0);
            vec4 ambient_light_color = vec4(0.1, 0.1, 0.1, 1.0);
            vec3 L = normalize(light - point.xyz);
            vec3 N = normalize(new_normal);
            float cos_theta = max(dot(N, L), 0.0);
            vec4 kd;
            if(show_texture){ 
                kd = texture2D(texture,textureCoord); 
            } 
            else{ 
                kd = vec4(0.5, 0.25, 0.8, 1.0); 
            }
            vec4 diffuse = kd * cos_theta;
            vec3 V = normalize(-point.xyz);
            vec3 H = normalize(L + V);
            float cos_phi = max(dot(N, H), 0.0);
            vec4 ks = light_color;
            vec4 specular = ks * pow(cos_phi, shininess);
            vec4 ambient = kd * ambient_light_color;
            gl_FragColor = light_color * (diffuse + specular) + ambient;
        }
    `;
}
