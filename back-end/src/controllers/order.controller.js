import { startCustomerPayment } from "../services/payment.service.js";

import {
  getCustomerOrders,
  createShippingTestOrder,
  createProductShippingTestOrder,
} from "../services/order.service.js";
import { getCustomerPaymentStatus } from "../services/paymentStatus.service.js";

import { getCustomerPaymentStatus } from "../services/paymentStatus.service.js";

// =========================================
// CREATE ORDER / START PAYMENT
// =========================================

export const createOrderController = async (req, res) => {
  try {
    const { shippingMethodId } = req.body ?? {};

    const result = await startCustomerPayment(req.user.id, shippingMethodId);

    return res.status(200).json({
      message: "درخواست پرداخت ایجاد شد.",
      ...result,
    });
  } catch (error) {
    console.error("START PAYMENT ERROR:", error);

    if (error.status) {
      return res.status(error.status).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "شروع پرداخت ناموفق بود. وضعیت سفارش را بررسی کنید.",
    });
  }
};

// =========================================
// CUSTOMER PAYMENT STATUS
// =========================================

export const getCustomerOrderPaymentStatusController = async (req, res) => {
  try {
    const result = await getCustomerPaymentStatus({
      userId: Number(req.user.id),
      orderId: Number(req.params.orderId),
    });

    return res.status(200).json({
      order: result,
    });
  } catch (error) {
    console.error("GET PAYMENT STATUS ERROR:", error);

    if (error.status) {
      return res.status(error.status).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "بررسی وضعیت پرداخت ناموفق بود.",
    });
  }
};

// =========================================
// CUSTOMER ORDERS
// =========================================

export const getCustomerOrdersController = async (req, res) => {
  try {
    const orders = await getCustomerOrders(req.user.id);

    return res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error("GET CUSTOMER ORDERS ERROR:", error);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "دریافت سفارش‌های شما ناموفق بود.",
    });
  }
};

// =========================================
// LEGACY SHIPPING TEST
// =========================================

export const createShippingTestOrderController = async (req, res, next) => {
  try {
    const order = await createShippingTestOrder(req.user.id);

    return res.status(201).json({
      message: "سفارش آزمایشی ارسال ساخته شد.",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// PRODUCT SHIPPING TEST
// =========================================

export const createProductShippingTestOrderController = async (
  req,
  res,
  next,
) => {
  try {
    const { shippingMethodId } = req.body ?? {};

    const order = await createProductShippingTestOrder(
      req.user.id,
      shippingMethodId,
    );

    return res.status(201).json({
      message: "سفارش آزمایشی محصول‌دار ساخته شد.",
      order,
    });
  } catch (error) {
    next(error);
  }
};
