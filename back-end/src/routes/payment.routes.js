import express from "express";
import {
  startPaymentController,
  zarinpalCallbackController,
  getPaymentStatusController,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// شروع پرداخت فقط برای کاربر احراز هویت‌شده
router.post("/start", requireAuth, startPaymentController);

// بازگشت از زرین‌پال؛ این مسیر باید عمومی باشد
router.get("/callback", zarinpalCallbackController);

// دریافت وضعیت پرداخت سفارش متعلق به کاربر فعلی
router.get("/orders/:orderId/status", requireAuth, getPaymentStatusController);

export default router;
