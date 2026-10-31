import express from "express";
import {
  createOrderController,
  createProductShippingTestOrderController,
  getCustomerOrderPaymentStatusController,
  getCustomerOrdersController,
} from "../controllers/order.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireCustomer } from "../middlewares/customer.middleware.js";

const router = express.Router();

// ثبت سفارش فقط برای مشتری واردشده مجاز است.
router.post("/", requireAuth, requireCustomer, createOrderController);

router.get(
  "/:orderId/payment-status",
  requireAuth,
  requireCustomer,
  getCustomerOrderPaymentStatusController,
);

router.get("/my", requireAuth, requireCustomer, getCustomerOrdersController);

if (process.env.NODE_ENV === "development") {
  router.post(
    "/shipping-test/products",
    requireAuth,
    requireCustomer,
    createProductShippingTestOrderController,
  );
}

export default router;
