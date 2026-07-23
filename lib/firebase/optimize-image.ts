type ImageOptions = {
  maxDimension?: number;
  quality?: number;
};

function encodeCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type: "image/webp" | "image/jpeg",
  quality: number,
): Promise<Blob | null> {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type, quality });
  }

  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function optimizedFileName(
  fileName: string,
  type: "image/webp" | "image/jpeg",
): string {
  const extensionIndex = fileName.lastIndexOf(".");
  const baseName =
    extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
  return `${baseName}.${type === "image/webp" ? "webp" : "jpg"}`;
}

export async function optimizeImage(
  file: File,
  options: ImageOptions = {},
): Promise<File> {
  if (
    typeof createImageBitmap !== "function" ||
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  let bitmap: ImageBitmap | undefined;

  try {
    const { maxDimension = 2560, quality = 0.82 } = options;
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

    // Preserve smaller images at their decoded dimensions; only downscale.
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let context:
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;

    if (typeof OffscreenCanvas === "function") {
      canvas = new OffscreenCanvas(width, height);
      context = canvas.getContext("2d");
    } else {
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      context = canvas.getContext("2d");
    }

    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);

    const webp = await encodeCanvas(canvas, "image/webp", quality);
    const blob =
      webp?.type === "image/webp"
        ? webp
        : await encodeCanvas(canvas, "image/jpeg", quality);

    if (
      !blob ||
      (blob.type !== "image/webp" && blob.type !== "image/jpeg") ||
      blob.size > file.size
    ) {
      return file;
    }

    return new File([blob], optimizedFileName(file.name, blob.type), {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch {
    // Decoding and canvas support vary by browser; preserve today's upload
    // behavior whenever optimization is unavailable or fails.
    return file;
  } finally {
    bitmap?.close();
  }
}
