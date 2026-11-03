import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { getSiteSettingsController, updateSiteSettingsController } from "../controllers/siteSettings.controller.js";

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
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) =>
      cb(null, `site-${Date.now()}-${Math.round(Math.random() * 1e9)}${extensions[file.mimetype]}`),
  }),
  fileFilter: (_req, file, cb) =>
    extensions[file.mimetype]
      ? cb(null, true)
      : cb(new Error("فقط JPG، PNG، WEBP و AVIF مجاز هستند.")),
  limits: { fileSize: 3 * 1024 * 1024, files: 2 },
});

router.get("/", getSiteSettingsController);
router.put("/", requireAuth, requireAdmin, (req, res, next) => {
  upload.fields([{ name: "logo", maxCount: 1 }, { name: "footerLogo", maxCount: 1 }])(req, res, (error) => {
    if (error) return res.status(400).json({ message: error.message || "آپلود تصویر ناموفق بود." });
    next();
  });
}, updateSiteSettingsController);

export default router;
