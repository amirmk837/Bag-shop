import express from "express";

import {
  getPaymentSettingsController,
  updatePaymentSettingsController,
} from "../controllers/paymentSettings.controller.js";

import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// تمام عملیات این مسیر فقط برای مدیر مجاز است.
router.use(requireAuth, requireAdmin);

// دریافت تنظیمات پرداخت
router.get("/", getPaymentSettingsController);

// ذخیره شناسه پذیرنده زرین‌پال
router.put("/", updatePaymentSettingsController);

export default router;
