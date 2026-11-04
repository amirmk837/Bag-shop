export const optimizeImage = async (
  file,
  {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    maxBytes = 500 * 1024,
  } = {},
) => {
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return file;
  }

  if (
    file.type === "image/webp" &&
    file.size <= maxBytes
  ) {
    return file;
  }

  if (typeof createImageBitmap !== "function") {
    return file;
  }

  let bitmap;

  try {
    bitmap = await createImageBitmap(file);

    const scale = Math.min(
      1,
      maxWidth / bitmap.width,
      maxHeight / bitmap.height,
    );

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";

    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("Image optimization skipped:", error);
    return file;
  } finally {
    bitmap?.close?.();
  }
};
