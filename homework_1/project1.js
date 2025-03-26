// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    const bgData = bgImg.data;
    const fgData = fgImg.data;

    for (let y = 0; y < fgImg.height; y++) {
        for (let x = 0; x < fgImg.width; x++) {
            // Compute corresponding background pixel position
            const bgX = x + fgPos.x;
            const bgY = y + fgPos.y;

            // Check if pixel is within the bounds of the background
            if (bgX < 0 || bgX >= bgImg.width || bgY < 0 || bgY >= bgImg.height) {
                continue;
            }

            // compute the array index of the current pixel in both the foreground and background image
            const fgIndex = (y * fgImg.width + x) * 4;
            const bgIndex = (bgY * bgImg.width + bgX) * 4;

            // Read foreground RGBA
            const fgR = fgData[fgIndex];
            const fgG = fgData[fgIndex + 1];
            const fgB = fgData[fgIndex + 2];
            const fgA = fgData[fgIndex + 3];

            // Normalize alpha
            const alpha = (fgA / 255) * fgOpac;

            // Alpha Blending Equation
            bgData[bgIndex]     = fgR * alpha + bgData[bgIndex]     * (1 - alpha);
            bgData[bgIndex + 1] = fgG * alpha + bgData[bgIndex + 1] * (1 - alpha);
            bgData[bgIndex + 2] = fgB * alpha + bgData[bgIndex + 2] * (1 - alpha);
            // Composite alpha (optional – usually just keep background alpha)
            // bgData[bgIndex + 3] = Math.max(fgA * fgOpac, bgData[bgIndex + 3]);
        }
    }
}
