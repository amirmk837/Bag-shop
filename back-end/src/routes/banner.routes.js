import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

import {
  activateBannerController,
  createBannerController,
  deleteBannerController,
  getActiveBannerController,
  getAdminBannersController,
  updateBannerController,
} from "../controllers/banner.controller.js";

import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { validateUploadedImages } from "../middlewares/validateImage.middleware.js";

const router = express.Router();

const uploadDir = path.resolve("public/uploads/banners");

fs.mkdirSync(uploadDir, {
  recursive: true,
});

const extensionByMime = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },

  filename: (_req, file, callback) => {
    const extension = extensionByMime[file.mimetype];

    if (!extension) {
      return callback(new Error("فرمت تصویر مجاز نیست."));
    }

    const uniqueName = `banner-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;

    callback(null, uniqueName);
  },
});

const upload = multer({
  storage,

  fileFilter: (_req, file, callback) => {
    if (!extensionByMime[file.mimetype]) {
      return callback(
        new Error("فقط تصاویر JPG، PNG، WEBP و AVIF مجاز هستند."),
      );
    }

    callback(null, true);
  },

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 2,
  },
});

const uploadBannerImages = (req, res, next) => {
  upload.fields([
    { name: "desktopImage", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
  ])(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message || "آپلود تصاویر بنر ناموفق بود.",
      });
    }

    next();
  });
};

// بنر فعال برای صفحه عمومی فروشگاه
router.get("/active", getActiveBannerController);

// بقیه مسیرها فقط برای ادمین
router.use(requireAuth, requireAdmin);

router.get("/", getAdminBannersController);

router.post("/", uploadBannerImages, validateUploadedImages, createBannerController);

router.patch("/:id", updateBannerController);

router.patch("/:id/activate", activateBannerController);

router.delete("/:id", deleteBannerController);

export default router;
