import express from "express";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  getPublicFaqController,
  getAdminFaqController,
  createFaqController,
  updateFaqController,
  deleteFaqController,
} from "../controllers/faq.controller.js";

const router = express.Router();
const adminLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 60 });

router.get("/", getPublicFaqController);
router.use("/admin", requireAuth, requirePermission("MANAGE_CONTENT"), adminLimit);
router.get("/admin", getAdminFaqController);
router.post("/admin", createFaqController);
router.put("/admin/:id", updateFaqController);
router.delete("/admin/:id", deleteFaqController);

export default router;
