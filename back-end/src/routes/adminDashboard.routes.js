import express from "express";

import { getAdminDashboardController } from "../controllers/adminDashboard.controller.js";

import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// تمام درخواست‌های این بخش فقط برای ادمین مجاز است.
router.use(requireAuth, requireAdmin);

router.get("/", getAdminDashboardController);

export default router;
