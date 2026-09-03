/**
 * Browser-side JPEG preparation for admin uploads.
 *
 * A camera-original JPEG can be 8–20 MB and 5000+ px wide while the largest
 * site presentation is far smaller. Resize before Storage receives it so the
 * bucket, admin upload and downstream optimizer do not all pay for pixels the
 * site will never display. Other formats pass through untouched: animated GIF,
 * transparency and SVG semantics must not be flattened by a generic canvas.
 */
export const MAX_JPEG_EDGE = 2400;
export const JPEG_QUALITY = 0.82;
const RECOMPRESS_OVER_BYTES = 1_000_000;

const isJpeg = (file: File): boolean =>
  file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name);

const canvasBlob = (
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

export async function prepareImageUpload(file: File): Promise<File> {
  if (!isJpeg(file) || typeof createImageBitmap !== "function") return file;

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_JPEG_EDGE / longest);

    // Small, already-efficient JPEGs gain nothing from another lossy pass.
    if (scale === 1 && file.size <= RECOMPRESS_OVER_BYTES) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await canvasBlob(canvas, JPEG_QUALITY);
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.jpe?g$/i, "") + ".jpg";
    return new File([blob], name, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}
