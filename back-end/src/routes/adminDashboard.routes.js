import express from "express";

import { getAdminDashboardController } from "../controllers/adminDashboard.controller.js";

import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

// تمام درخواست‌های این بخش فقط برای ادمین مجاز است.
router.use(requireAuth, requirePermission("VIEW_ANALYTICS"));

router.get("/", getAdminDashboardController);

export default router;
