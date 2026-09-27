import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

const uploadDir = path.resolve("public/uploads/products");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, name);
  },
});

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("فقط فایل‌های JPG، PNG، WEBP و AVIF مجاز هستند."));
    }

    cb(null, true);
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/product-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "تصویری انتخاب نشده است.",
    });
  }

  const imageUrl = `/uploads/products/${req.file.filename}`;

  res.status(201).json({
    success: true,
    data: {
      url: imageUrl,
      filename: req.file.filename,
    },
  });
});

export default router;
