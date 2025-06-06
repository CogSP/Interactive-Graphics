//
document.addEventListener("keydown", keyDownTextField, false);
function keyDownTextField(e) {
	var keyCode = e.keyCode;
	if(keyCode==115) {	// F4
		document.getElementById('includedscript').remove();
		var head = document.getElementsByTagName('head')[0];
		var script = document.createElement('script');
		script.src= 'project5.js';
		script.id = 'includedscript';
		script.onload = function() {
			primaryRT.init();
			secondaryRT.init();
			DrawScene();
		}
		head.appendChild(script);
		console.log('New script loaded.');
	}
}

//
function TriSphere(subdiv)
{
	var faces = [];
	var verts = [];
	verts.push(0,0, 1);
	verts.push(0,0,-1);
	var vpt = 0;
	var vpb = 1;
	var vi = 2;
	for ( var i=1; i<subdiv; ++i ) {
		var a = Math.PI * i / (2*subdiv);
		var z = Math.cos(a);
		var r = Math.sin(a);
		a = 0;
		var da = Math.PI / (2*i);
		var v0t = vpt;
		var v0b = vpb;
		var v1t = vi++;
		var v1b = vi++;
		verts.push(r,0, z);
		verts.push(r,0,-z);
		for ( var s=0; s<4; ++s ) {
			for ( var j=1; j<i; ++j ) {
				a += da;
				var x = Math.cos(a)*r;
				var y = Math.sin(a)*r;
				verts.push( x, y,  z );
				verts.push( x, y, -z );
				faces.push( v0t, vi-2, vi );
				faces.push( v0t, vi, v0t+2 );
				faces.push( v0b, vi-1, vi+1 );
				faces.push( v0b, vi+1, v0b+2 );
				v0t+=2;
				v0b+=2;
				vi+=2;
			}
			if ( s < 3 ) {
				a += da;
				var x = Math.cos(a)*r;
				var y = Math.sin(a)*r;
				verts.push( x, y,  z );
				verts.push( x, y, -z );
				faces.push( v0t, vi-2, vi );
				faces.push( v0b, vi-1, vi+1 );
				vi+=2;
			}
		}
		if ( i > 1 ) {
			faces[ faces.length-7 ] = vpt;
			faces[ faces.length-1 ] = vpb;
		}
		faces.push( vpt, vi-2, v1t );
		faces.push( vpb, vi-1, v1b );
		vpt = v1t;
		vpb = v1b;
	}
	var a = 0;
	var da = Math.PI / (2*subdiv);
	verts.push(1,0,0);
	var v0t = vpt;
	var v0b = vpb;
	var v1 = vi++;
	for ( var s=0; s<4; ++s ) {
		for ( var j=1; j<subdiv; ++j ) {
			a += da;
			var x = Math.cos(a);
			var y = Math.sin(a);
			verts.push( x, y, 0 );
			faces.push( v0t, vi-1, vi );
			faces.push( v0t, vi, v0t+2 );
			faces.push( v0b, vi-1, vi );
			faces.push( v0b, vi, v0b+2 );
			v0t+=2;
			v0b+=2;
			vi++;
		}
		if ( s < 3 ) {
			a += da;
			var x = Math.cos(a);
			var y = Math.sin(a);
			verts.push( x, y, 0 );
			faces.push( v0t, vi-1, vi );
			faces.push( v0b, vi-1, vi );
			vi++;
		}
	}
	if ( subdiv > 1 ) {
		faces[ faces.length-7 ] = vpt;
		faces[ faces.length-1 ] = vpb;
	}
	faces.push( vpt, vi-1, v1 );
	faces.push( vpb, vi-1, v1 );
	return { pos:verts, elems:faces };
}

var triSphere = {
	init()
	{
		var b = TriSphere(20);
		this.pbuf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.pbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(b.pos), gl.STATIC_DRAW);
		this.ebuf = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebuf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(b.elems), gl.STATIC_DRAW);
		this.count = b.elems.length;
	},
	draw( vp )
	{
		gl.bindBuffer( gl.ARRAY_BUFFER, this.pbuf );
		gl.vertexAttribPointer( vp, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( vp );
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.ebuf );
		gl.drawElements( gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0 );
	}
};

class SphereProg
{
	init()
	{
		this.mvp     = gl.getUniformLocation( this.prog, 'mvp' );
		this.campos  = gl.getUniformLocation( this.prog, 'campos' );
		this.center  = gl.getUniformLocation( this.prog, 'center' );
		this.radius  = gl.getUniformLocation( this.prog, 'radius' );
		this.mtl_k_d = gl.getUniformLocation( this.prog, 'mtl.k_d' );
		this.mtl_k_s = gl.getUniformLocation( this.prog, 'mtl.k_s' );
		this.mtl_n   = gl.getUniformLocation( this.prog, 'mtl.n' );
		this.vp      = gl.getAttribLocation ( this.prog, 'p' );
	}
	setTrans( mvp, campos )
	{
		gl.useProgram( this.prog );
		gl.uniformMatrix4fv( this.mvp, false, mvp );
		gl.uniform3fv( this.campos, campos );
	}
	setLight( pos, intens )
	{
		gl.useProgram( this.prog );
		gl.uniform3fv( gl.getUniformLocation( this.prog, 'light.position'  ), pos    );
		gl.uniform3fv( gl.getUniformLocation( this.prog, 'light.intensity' ), intens );
	}
	draw( sphere )
	{
		gl.useProgram( this.prog );
		gl.uniform3fv( this.center,  sphere.center  );
		gl.uniform1f ( this.radius,  sphere.radius  );
		gl.uniform3fv( this.mtl_k_d, sphere.mtl.k_d );
		gl.uniform3fv( this.mtl_k_s, sphere.mtl.k_s );
		gl.uniform1f ( this.mtl_n,   sphere.mtl.n   );
		triSphere.draw( this.vp );
	}
};

class SphereDrawer extends SphereProg
{
	constructor()
	{
		super();
		this.prog = InitShaderProgramFromScripts( 'sphereVS', 'sphereFS' );
		this.init();
	}
};

const transZmin = 1.001;
const transZmax = 10;
const maxBounceLimit = 16;

var sphereDrawer;
var canvas, gl;
var perspectiveMatrix;	// perspective projection matrix
var environmentTexture;
var viewRotX=0, viewRotZ=0, transZ=3;
var sphereCount = 10;
var primaryRT, secondaryRT;

var fixed_spheres = [
	{
		center: [ 0, 0, -10001.0 ],
		radius: 10000.0,
		mtl: {
			k_d: [ 0.1, 0.1, 0.2 ],
			k_s: [ 0.2, 0.2, 0.2 ],
			n: 10
		}
	},
	{
		center: [ 0, 0, 0 ],
		radius: 1.0,
		mtl: {
			k_d: [ 0.5, 0.0, 0.0 ],
			k_s: [ 0.8, 0.8, 0.8 ],
			n: 100
		}
	},
];

var spheres = fixed_spheres.slice();

var lights = [
	{
		position:  [ 0, 0, 1000 ],
		intensity: [ 1.0, 1.0, 1.0 ]
	}, 
];

const raytraceFS_header = `
	precision highp float;
	precision highp int;
`;

const raytraceFS_primary = `
	varying vec3 ray_pos;
	varying vec3 ray_dir;

	void main()
	{
		Ray primary_ray;
		primary_ray.pos = ray_pos;
		primary_ray.dir = ray_dir;
		gl_FragColor = RayTracer( primary_ray );
	}
`;

const raytraceFS_secondary = `
	uniform Material mtl;
	uniform vec3     campos;
	varying vec3     pos;
	varying vec3     normal;
	void main()
	{
		vec3 nrm = normalize( normal );
		vec3 view = normalize( campos - pos );
		vec3 color = Shade( mtl, pos, nrm, view );
		if ( mtl.k_s.r > 0.0 || mtl.k_s.g > 0.0 || mtl.k_s.b > 0.0 ) 
		{
			Ray ray;
			ray.pos = pos;
			ray.dir = reflect( -view, nrm );
			vec4 reflection = RayTracer( ray );
			color += mtl.k_s * reflection.rgb;
		}
		gl_FragColor = vec4( color, 1 );
	}
`;

class RayTracer
{
	constructor()
	{
		this.bounceLimit = 5;
	}
	initProg( vs, fs )
	{
		if ( this.prog ) gl.deleteProgram( this.prog );

		const raytraceFS_head = raytraceFS_header + `
			#define NUM_SPHERES ` + spheres.length + `
			#define NUM_LIGHTS  ` + lights.length + `
			#define MAX_BOUNCES ` + maxBounceLimit + `
		`;
		this.prog = InitShaderProgram( vs, raytraceFS_head+raytraceFS+fs );
		if ( ! this.prog ) return;
		
		function setMaterial( prog, v, mtl )
		{
			gl.uniform3fv( gl.getUniformLocation( prog, v+'.k_d' ), mtl.k_d );
			gl.uniform3fv( gl.getUniformLocation( prog, v+'.k_s' ), mtl.k_s );
			gl.uniform1f ( gl.getUniformLocation( prog, v+'.n'   ), mtl.n   );
		}
		
		gl.useProgram( this.prog );
		gl.uniform1i( gl.getUniformLocation( this.prog, 'bounceLimit' ), this.bounceLimit );
		for ( var i=0; i<spheres.length; ++i ) {
			gl.uniform3fv( gl.getUniformLocation( this.prog, 'spheres['+i+'].center' ), spheres[i].center );
			gl.uniform1f ( gl.getUniformLocation( this.prog, 'spheres['+i+'].radius' ), spheres[i].radius );
			setMaterial( this.prog, 'spheres['+i+'].mtl', spheres[i].mtl );
			// console.log(spheres[i]);
		}
		for ( var i=0; i<lights.length; ++i ) {
			gl.uniform3fv( gl.getUniformLocation( this.prog, 'lights['+i+'].position'  ), lights[i].position  );
			gl.uniform3fv( gl.getUniformLocation( this.prog, 'lights['+i+'].intensity' ), lights[i].intensity );
		}
		this.updateProj();
	}
	updateProj()
	{
		if ( ! this.prog ) return;
		gl.useProgram( this.prog );
		var proj = gl.getUniformLocation( this.prog, 'proj' );
		gl.uniformMatrix4fv( proj, false, perspectiveMatrix );
	}
	setBounceLimit( bounceLimit )
	{
		this.bounceLimit = bounceLimit;
		if ( ! this.prog ) return;
		gl.useProgram( this.prog );
		gl.uniform1i( gl.getUniformLocation( this.prog, 'bounceLimit' ), this.bounceLimit );
	}
};

class PrimaryRayTracer extends RayTracer
{
	init()
	{
		this.initProg( document.getElementById('raytraceVS').text, raytraceFS_primary );
	}
	draw( trans )
	{
		if ( ! this.prog ) return;
		screenQuad.draw( this.prog, trans );
	}
}

class SecondaryRayTracer extends RayTracer
{
	constructor()
	{
		super();
		this.sphere = new SphereProg;
	}
	init()
	{
		this.initProg( document.getElementById('sphereVS').text, raytraceFS_secondary );
		if ( ! this.prog ) return;
		this.sphere.prog = this.prog;
		this.sphere.init();
	}
	draw( mvp, trans )
	{
		if ( ! this.prog ) return;
		background.draw( trans );
		this.sphere.setTrans( mvp, [ trans.camToWorld[12], trans.camToWorld[13], trans.camToWorld[14] ] );
		spheres.forEach( s => this.sphere.draw(s) );
	}
}

var screenQuad = {
	init( fov, z )
	{
		if ( ! this.vbuf ) this.vbuf = gl.createBuffer();
		const r = canvas.width / canvas.height;
		const ff = Math.PI * fov / 180;
		const tant_2 = Math.tan( ff/2 );
		const y = z * tant_2;
		const x = y * r;
		const rtp = [
			-x, -y, -z,
			 x, -y, -z,
			 x,  y, -z,
			-x, -y, -z,
			 x,  y, -z,
			-x,  y, -z,
		];
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rtp), gl.STATIC_DRAW);
	},
	draw( prog, trans )
	{
		gl.useProgram( prog );
		gl.uniformMatrix4fv( gl.getUniformLocation( prog, 'c2w' ), false, trans.camToWorld );
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vbuf );
		var p = gl.getAttribLocation ( prog, 'p' );
		gl.vertexAttribPointer( p, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( p );
		gl.drawArrays( gl.TRIANGLES, 0, 6 );
	}
};

var background = {
	init()
	{
		this.prog = InitShaderProgramFromScripts( 'raytraceVS', 'envFS' );
	},
	updateProj()
	{
		gl.useProgram( this.prog );
		gl.uniformMatrix4fv( gl.getUniformLocation( this.prog, 'proj' ), false, perspectiveMatrix );
	},
	draw( trans )
	{
		gl.depthMask( false );
		screenQuad.draw( this.prog, trans );
		gl.depthMask( true );
	}
};

function InitScene()
{
	spheres = fixed_spheres.slice();
	const count = sphereCount;
	const size = Math.sqrt(count)/2 + 1;
	for ( var i=1; i<count; ++i ) {
		var valid = false;
		var x, y, z, r;
		while ( ! valid ) {
			a = Math.random() * Math.PI * 2;
			b = Math.random() * size;
			x = Math.cos(a) * b;
			y = Math.sin(a) * b;
			r = Math.random()*0.6 + 0.1;
			z = r-1;
			valid = true;
			for ( var j=1; j<spheres.length; ++j ) {
				const c = spheres[j].center;
				const dx = c[0] - x;
				const dy = c[1] - y;
				const dz = c[2] - z;
				const len = Math.sqrt( dx*dx + dy*dy + dz*dz );
				if ( len < r + spheres[j].radius ) {
					valid = false;
					break;
				}
			}
		}
		const ks = Math.random();
		const n = Math.random()*1000;
		spheres.push({
			center: [x,y,z],
			radius: r,
			mtl: {
				k_d: [ Math.random(), Math.random(), Math.random() ],
				k_s: [ ks, ks, ks ],
				n: n
			}
		});
	}
	primaryRT.init();
	secondaryRT.init();
}

function InitEnvironmentMap()
{
	environmentTexture = gl.createTexture();
	gl.bindTexture( gl.TEXTURE_CUBE_MAP, environmentTexture );
	
	const url = 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/';
	const files = [
	  'pos-x.jpg',
	  'neg-x.jpg',
	  'pos-y.jpg',
	  'neg-y.jpg',
	  'pos-z.jpg',
	  'neg-z.jpg',
	];
	const faces = [
		gl.TEXTURE_CUBE_MAP_POSITIVE_X,
		gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
		gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
		gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
		gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
		gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
	];

	var loaded = 0;
	for ( var i=0; i<6; ++i ) {
		gl.texImage2D( faces[i], 0, gl.RGBA, 128, 128, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.face = faces[i];
		img.onload = function() {
			gl.bindTexture( gl.TEXTURE_CUBE_MAP, environmentTexture );
			gl.texImage2D( this.face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this );
			loaded++;
			if ( loaded == 6 ) {
				gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
				DrawScene();
			}
		};
		img.src = url + files[i];
	}
	gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
}

// Called once to initialize
function InitWebGL()
{
	// Initialize the WebGL canvas
	canvas = document.getElementById("canvas");
	canvas.oncontextmenu = function() {return false;};
	gl = canvas.getContext("webgl", {antialias: false, depth: true});	// Initialize the GL context
	if (!gl) {
		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		return;
	}
	
	// Initialize settings
	gl.clearColor(0,0,0,0);
	gl.enable(gl.DEPTH_TEST);
	
	InitEnvironmentMap();

	triSphere.init();
	background.init();

	primaryRT   = new PrimaryRayTracer;
	secondaryRT = new SecondaryRayTracer;

	sphereDrawer = new SphereDrawer;
	sphereDrawer.setLight( lights[0].position, lights[0].intensity );

	UpdateCanvasSize();
	InitScene();
}

// Called every time the window size is changed.
function UpdateCanvasSize()
{
	canvas.style.width  = "100%";
	canvas.style.height = "100%";
	const pixelRatio = window.devicePixelRatio || 1;
	canvas.width  = pixelRatio * canvas.clientWidth;
	canvas.height = pixelRatio * canvas.clientHeight;
	const width  = (canvas.width  / pixelRatio);
	const height = (canvas.height / pixelRatio);
	canvas.style.width  = width  + 'px';
	canvas.style.height = height + 'px';
	gl.viewport( 0, 0, canvas.width, canvas.height );
	UpdateProjectionMatrix();
}

function UpdateProjectionMatrix()
{
	const fov = 60;
	var r = canvas.width / canvas.height;
	var n = 0.1;
	const min_n = 0.001;
	if ( n < min_n ) n = min_n;
	var f = transZmax*100;
	var ff = Math.PI * fov / 180;
	var tant_2 = Math.tan( ff/2 );
	var s = 1 / tant_2;
	perspectiveMatrix = [
		s/r, 0, 0, 0,
		0, s, 0, 0,
		0, 0, -(n+f)/(f-n), -1,
		0, 0, -2*n*f/(f-n), 0
	];
	
	screenQuad.init(fov,(n+f)/2);
	background.updateProj();
	primaryRT.updateProj();
	secondaryRT.updateProj();
}

function GetTrans()
{
	function dot(a,b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }

	var cz = Math.cos( viewRotZ );
	var sz = Math.sin( viewRotZ );
	var cx = Math.cos( viewRotX );
	var sx = Math.sin( viewRotX );

	var z = [ cx*sz, -cx*cz, sx ];
	var c = [ z[0]*transZ, z[1]*transZ, z[2]*transZ ];	
	var xlen = Math.sqrt( z[0]*z[0] + z[1]*z[1] );
	var x = [ -z[1]/xlen, z[0]/xlen, 0 ];
	var y = [ z[1]*x[2] - z[2]*x[1], z[2]*x[0] - z[0]*x[2], z[0]*x[1] - z[1]*x[0] ];
	
	var worldToCam = [
		x[0], y[0], z[0], 0,
		x[1], y[1], z[1], 0,
		x[2], y[2], z[2], 0,
		-dot(x,c), -dot(y,c), -dot(z,c), 1,
	];
	var camToWorld = [
		x[0], x[1], x[2], 0,
		y[0], y[1], y[2], 0,
		z[0], z[1], z[2], 0,
		c[0], c[1], c[2], 1
	];
	return { camToWorld:camToWorld, worldToCam:worldToCam };
}

// This is the main function that handled WebGL drawing
function DrawScene()
{
	gl.flush();
	
	var trans = GetTrans();
	var mvp = MatrixMult( perspectiveMatrix, trans.worldToCam );

	// Clear the screen and the depth buffer.
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	// Rasterization
	if ( document.getElementById('raster').checked ) {
		background.draw( trans );
		sphereDrawer.setTrans( mvp, [ trans.camToWorld[12], trans.camToWorld[13], trans.camToWorld[14] ] );
		spheres.forEach( s => sphereDrawer.draw(s) );
	}
	
	// Ray Tracing
	if ( document.getElementById('raytrace').checked ) {
		primaryRT.draw( trans );
	}
	
	// Rasterization + Ray Tracing
	if ( document.getElementById('secondary').checked ) {
		secondaryRT.draw( mvp, trans );
	}
}

// This is a helper function for compiling the given vertex and fragment shader script ids into a program.
function InitShaderProgramFromScripts( vs, fs )
{
	return InitShaderProgram( document.getElementById(vs).text, document.getElementById(fs).text );	
}

// This is a helper function for compiling the given vertex and fragment shader source code into a program.
function InitShaderProgram( vsSource, fsSource )
{
	const vs = CompileShader( gl.VERTEX_SHADER,   vsSource );
	const fs = CompileShader( gl.FRAGMENT_SHADER, fsSource );

	if ( ! vs || ! fs ) return null;
	
	const prog = gl.createProgram();
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);

	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(prog));
		return null;
	}
	return prog;
}

// This is a helper function for compiling a shader, called by InitShaderProgram().
function CompileShader( type, source )
{
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter( shader, gl.COMPILE_STATUS) ) {
		alert('An error occurred compiling shader:\n' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

// Multiplies two matrices and returns the result A*B.
// The arguments A and B are arrays, representing column-major matrices.
function MatrixMult( A, B )
{
	var C = [];
	for ( var i=0; i<4; ++i ) {
		for ( var j=0; j<4; ++j ) {
			var v = 0;
			for ( var k=0; k<4; ++k ) {
				v += A[j+4*k] * B[k+4*i];
			}
			C.push(v);
		}
	}
	return C;
}

window.onload = function() {
	InitWebGL();
	canvas.zoom = function( s ) {
		transZ *= s/canvas.height + 1;
		if ( transZ < transZmin ) transZ = transZmin;
		if ( transZ > transZmax ) transZ = transZmax;
		UpdateProjectionMatrix();
		DrawScene();
	}
	canvas.onwheel = function() { canvas.zoom(0.3*event.deltaY); }
	canvas.onmousedown = function() {
		var cx = event.clientX;
		var cy = event.clientY;
		if ( event.ctrlKey ) {
			canvas.onmousemove = function() {
				canvas.zoom(5*(event.clientY - cy));
				cy = event.clientY;
			}
		} else {
			canvas.onmousemove = function() {
				viewRotZ += (cx - event.clientX)/canvas.width*5;
				viewRotX -= (cy - event.clientY)/canvas.height*5;
				cx = event.clientX;
				cy = event.clientY;
				const eps = 0.01;
				if ( viewRotX < -0.1 ) viewRotX = -0.1;
				if ( viewRotX > Math.PI/2 - eps ) viewRotX = Math.PI/2 - eps;
				UpdateProjectionMatrix();
				DrawScene();
			}
		}
	}
	canvas.onmouseup = canvas.onmouseleave = function() {
		canvas.onmousemove = null;
	}
	
	DrawScene();
};

function WindowResize()
{
	UpdateCanvasSize();
	DrawScene();
}

function UseEnvironmentMap( param )
{
	gl.bindTexture( gl.TEXTURE_CUBE_MAP, param.checked ? environmentTexture : null );
	DrawScene();
}

function IncBounceLimit( inc )
{
	var b = parseInt(document.getElementById('bounces-value').innerText);
	b += inc;
	if ( b < 0 ) b = 0;
	if ( b > maxBounceLimit ) b = maxBounceLimit;
	SetBounceLimit( b );
	document.getElementById('bounces-range').value = b;
}

function SetBounceLimit( b )
{
	document.getElementById('bounces-value').innerText = b;
	primaryRT.setBounceLimit( b );
	secondaryRT.setBounceLimit( b );
	UpdateProjectionMatrix();
	DrawScene();
}

function IncCount( inc )
{
	var c = parseInt(document.getElementById('count-value').innerText);
	c += inc;
	if ( c < 1 ) c = 1;
	if ( c > 100 ) c = 100;
	SetCount( c );
	document.getElementById('count-range').value = c;
	NewScene();
}

function SetCount( c )
{
	document.getElementById('count-value').innerText = c;
	sphereCount = c;
}

function NewScene()
{
	InitScene();
	primaryRT.init();
	secondaryRT.init();
	DrawScene();
}

function ShowControls()
{
	var c = document.getElementById('controls');
	c.style.display = c.style.display == 'none' ? '' : 'none';
}

///////////////////////////////////////////////////////////////////////////////////
