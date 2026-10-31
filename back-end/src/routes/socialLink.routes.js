import express from "express";
import {
  getAdminSocialLinksController,
  getPublicSocialLinksController,
  saveSocialLinkController,
} from "../controllers/socialLink.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// دریافت لینک‌های عمومی برای Footer
router.get("/", getPublicSocialLinksController);

// مسیرهای مدیریتی فقط برای ادمین
router.use(requireAuth, requireAdmin);

router.get("/admin", getAdminSocialLinksController);
router.put("/admin/:platform", saveSocialLinkController);

export default router;
