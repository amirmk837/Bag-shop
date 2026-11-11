import express from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  getPublicAboutPageController,
  getAdminAboutPageController,
  updateAboutPageController,
} from "../controllers/aboutPage.controller.js";

const router = express.Router();
const adminLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 });

router.get("/", getPublicAboutPageController);
router.get("/admin", requireAuth, requireAdmin, adminLimit, getAdminAboutPageController);
router.put("/admin", requireAuth, requireAdmin, adminLimit, updateAboutPageController);

export default router;
