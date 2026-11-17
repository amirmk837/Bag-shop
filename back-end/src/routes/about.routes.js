import express from "express";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  getPublicAboutPageController,
  getAdminAboutPageController,
  updateAboutPageController,
} from "../controllers/aboutPage.controller.js";

const router = express.Router();
const adminLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 });

router.get("/", getPublicAboutPageController);
router.get("/admin", requireAuth, requirePermission("MANAGE_CONTENT"), adminLimit, getAdminAboutPageController);
router.put("/admin", requireAuth, requirePermission("MANAGE_CONTENT"), adminLimit, updateAboutPageController);

export default router;
