import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

import {
  getPublicFooterTrustBadgesController,
  getAdminFooterTrustBadgesController,
  createFooterTrustBadgeController,
  updateFooterTrustBadgeController,
  deleteFooterTrustBadgeController,
} from "../controllers/footerTrustBadge.controller.js";

import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { validateUploadedImages } from "../middlewares/validateImage.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

const uploadDir = path.resolve("public/uploads/footer-trust");
fs.mkdirSync(uploadDir, { recursive: true });

const extensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDir),
    filename: (_req, file, callback) => {
      const extension = extensions[file.mimetype];

      if (!extension) {
        return callback(new Error("فرمت تصویر مجاز نیست."));
      }

      callback(
        null,
        `trust-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`,
      );
    },
  }),

  fileFilter: (_req, file, callback) => {
    if (!extensions[file.mimetype]) {
      return callback(
        new Error("فقط تصاویر JPG، PNG، WEBP و AVIF مجاز هستند."),
      );
    }

    callback(null, true);
  },

  limits: {
    fileSize: 3 * 1024 * 1024,
    files: 1,
    fields: 8,
    parts: 10,
  },
});

const uploadImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "حجم تصویر نباید بیشتر از ۳ مگابایت باشد.",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "فیلد تصویر ارسالی معتبر نیست.",
      });
    }

    return res.status(400).json({
      message: error.message || "بارگذاری تصویر ناموفق بود.",
    });
  });
};

const adminRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
});

// دریافت عمومی فقط نمادهای فعال
router.get("/", getPublicFooterTrustBadgesController);

// همه مسیرهای مدیریتی نیازمند احراز هویت و نقش مدیر هستند
router.use(requireAuth, requireAdmin, adminRateLimit);

router.get("/admin", getAdminFooterTrustBadgesController);

router.post(
  "/admin",
  uploadImage,
  validateUploadedImages,
  createFooterTrustBadgeController,
);

router.patch(
  "/admin/:id",
  uploadImage,
  validateUploadedImages,
  updateFooterTrustBadgeController,
);

router.delete("/admin/:id", deleteFooterTrustBadgeController);

export default router;
