import sharp from "sharp";

/**
 * Crops an image buffer to the bounding box of non-transparent pixels.
 * Assumes the image has an alpha channel (RGBA).
 */
export async function cropToNonTransparent(
  inputBuffer: Buffer,
  alphaThreshold = 10
) {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const alpha = data[idx + 3];

      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1 || maxY === -1) {
    return inputBuffer;
  }

  const extractRegion = {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };

  const cropped = await sharp(inputBuffer).extract(extractRegion).toBuffer();

  return cropped;
}
