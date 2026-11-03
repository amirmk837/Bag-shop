import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { validateUploadedImages } from "../middlewares/validateImage.middleware.js";
import { handleUploadError } from "../middlewares/uploadError.middleware.js";
import {
  getSiteSettingsController,
  updateSiteSettingsController,
} from "../controllers/siteSettings.controller.js";

const router = express.Router();
const uploadDir = path.resolve("public/uploads/site");
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
      callback(
        null,
        `site-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`,
      );
    },
  }),
  fileFilter: (_req, file, callback) =>
    extensions[file.mimetype]
      ? callback(null, true)
      : callback(new Error("فقط JPG، PNG، WEBP و AVIF مجاز هستند.")),
  limits: {
    fileSize: 3 * 1024 * 1024,
    files: 2,
    fields: 10,
    parts: 12,
  },
});

const parseSiteSettingsUpload = (req, res, next) => {
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "footerLogo", maxCount: 1 },
  ])(req, res, (error) => {
    if (error) return handleUploadError(error, req, res, next);
    return next();
  });
};

router.get("/", getSiteSettingsController);

router.put(
  "/",
  requireAuth,
  requireAdmin,
  parseSiteSettingsUpload,
  handleUploadError,
  validateUploadedImages,
  updateSiteSettingsController,
);

export default router;
