import fs from "node:fs/promises";

const hasValidImageSignature = (buffer) => {
  if (buffer.length >= 3 &&
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true; // JPEG
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return true; // PNG
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return true; // WebP
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 4, 8) === "ftyp" &&
    ["avif", "avis"].includes(buffer.toString("ascii", 8, 12))
  ) {
    return true; // AVIF
  }

  return false;
};

export const validateUploadedImages = async (req, res, next) => {
  const files = [
    ...(req.file ? [req.file] : []),
    ...Object.values(req.files || {}).flat(),
  ];

  if (!files.length) return next();

  try {
    for (const file of files) {
      const handle = await fs.open(file.path, "r");
      const header = Buffer.alloc(16);
      let bytesRead;
      try {
        ({ bytesRead } = await handle.read(header, 0, header.length, 0));
      } finally {
        await handle.close();
      }

      if (!hasValidImageSignature(header.subarray(0, bytesRead))) {
        await Promise.all(files.map((item) => fs.unlink(item.path).catch(() => {})));
        return res.status(400).json({
          success: false,
          message: "محتوای فایل با فرمت تصویر مجاز مطابقت ندارد.",
        });
      }
    }

    return next();
  } catch {
    await Promise.all(files.map((item) => fs.unlink(item.path).catch(() => {})));
    return res.status(400).json({
      success: false,
      message: "بررسی محتوای تصویر ناموفق بود.",
    });
  }
};
