import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

const uploadDir = path.resolve("public/uploads/products");

fs.mkdirSync(uploadDir, {
  recursive: true,
});

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },

  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);

    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    callback(null, name);
  },
});

const upload = multer({
  storage,

  fileFilter: (_req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("فقط فایل‌های JPG، PNG، WEBP و AVIF مجاز هستند."),
      );
    }

    callback(null, true);
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// =========================================
// ADMIN: PRODUCT IMAGE
// =========================================

router.post(
  "/product-image",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "تصویری انتخاب نشده است.",
      });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
      },
    });
  },
);

export default router;
