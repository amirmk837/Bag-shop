import express from "express";
import {
  startPaymentController,
  zarinpalCallbackController,
  getPaymentStatusController,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rateLimit.middleware.js";

const limitPaymentStart = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });
const limitPaymentCallback = createRateLimiter({ windowMs: 60 * 1000, max: 30 });
const limitPaymentStatus = createRateLimiter({ windowMs: 60 * 1000, max: 60 });

const router = express.Router();

// شروع پرداخت فقط برای کاربر احراز هویت‌شده
router.post("/start", limitPaymentStart, requireAuth, startPaymentController);

// بازگشت از زرین‌پال؛ این مسیر باید عمومی باشد
router.get("/callback", limitPaymentCallback, zarinpalCallbackController);

// دریافت وضعیت پرداخت سفارش متعلق به کاربر فعلی
router.get("/orders/:orderId/status", limitPaymentStatus, requireAuth, getPaymentStatusController);

export default router;
