import fs from "node:fs/promises";
import path from "node:path";

const detectImageType = (buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) return "png";

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) return "webp";

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 4, 8) === "ftyp" &&
    ["avif", "avis"].includes(buffer.toString("ascii", 8, 12))
  ) return "avif";

  return null;
};

const IMAGE_FORMATS = {
  jpeg: { mime: "image/jpeg", extensions: [".jpg", ".jpeg"] },
  png: { mime: "image/png", extensions: [".png"] },
  webp: { mime: "image/webp", extensions: [".webp"] },
  avif: { mime: "image/avif", extensions: [".avif"] },
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

      const detectedType = detectImageType(header.subarray(0, bytesRead));
      const expectedFormat = IMAGE_FORMATS[detectedType];
      const extension = path.extname(file.originalname || "").toLowerCase();

      if (
        !expectedFormat ||
        file.mimetype !== expectedFormat.mime ||
        !expectedFormat.extensions.includes(extension)
      ) {
        await Promise.all(files.map((item) => fs.unlink(item.path).catch(() => {})));
        return res.status(400).json({
          success: false,
          message: "محتوای فایل با نوع و پسوند تصویر ارسالی مطابقت ندارد.",
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
