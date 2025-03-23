// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform(positionX, positionY, rotation, scale) {
    const rad = rotation * Math.PI / 180.0;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

	// In homogeneous coordinates a 2D point [x, y] is represented as [x, y, 1] 
	// and transformations are applied using a 3×3 matrix like this:
	//[ a  d  tx ]
	//[ b  e  ty ]
	//[ 0  0  1  ]
	// a, b, d, e affect rotation and scaling.
	// tx, ty is the translation (positionX, positionY).

	// meanwhile, in column-major order:
    return [
        cos * scale,         sin * scale,         0,
       -sin * scale,         cos * scale,         0,
        positionX,           positionY,           1
    ];
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform(trans1, trans2) {
    const result = new Array(9);

    // Matrix multiplication: result = trans2 * trans1
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            result[col * 3 + row] =
                trans2[0 * 3 + row] * trans1[col * 3 + 0] +
                trans2[1 * 3 + row] * trans1[col * 3 + 1] +
                trans2[2 * 3 + row] * trans1[col * 3 + 2];
        }
    }

    return result;
}

