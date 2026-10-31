import { reconcileRequestedPaymentById } from "../services/paymentCallback.service.js";
import { getAdminAuditLogs } from "../services/adminAudit.service.js";

import {
  getPaymentReconciliationQueue,
  expireUnsentPayment,
  deleteAdminOrder,
  getAdminOrderDetail,
  getAdminOrders,
  updateAdminOrderStatus,
  updateAdminOrderShipping,
} from "../services/adminOrder.service.js";

// =========================================
// GET PAYMENT RECONCILIATION QUEUE
// =========================================

export const getPaymentReconciliationQueueController = async (req, res) => {
  try {
    const result = await getPaymentReconciliationQueue({
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    return res.status(200).json({
      success: true,
      message: "پرداخت‌های نیازمند بررسی دریافت شدند.",
      ...result,
    });
  } catch (error) {
    console.error("GET PAYMENT RECONCILIATION QUEUE ERROR:", {
      errorType: error?.name || "Error",
    });
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "خطا در دریافت فهرست پرداخت‌ها.",
    });
  }
};

// =========================================
// GET ORDERS
// =========================================

export const getAdminOrdersController = async (req, res) => {
  try {
    const result = await getAdminOrders({
      page: req.query.page,
      pageSize: req.query.pageSize,
      status: req.query.status,
      search: req.query.search,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("GET ADMIN ORDERS ERROR:", error);

    return res.status(error.status || 500).json({
      message: error.status ? error.message : "خطا در دریافت سفارش‌ها.",
    });
  }
};

// =========================================
// GET ORDER DETAIL
// =========================================

export const getAdminOrderDetailController = async (req, res) => {
  try {
    const order = await getAdminOrderDetail(req.params.id);

    return res.status(200).json({ order });
  } catch (error) {
    console.error("GET ADMIN ORDER DETAIL ERROR:", error);

    return res.status(error.status || 500).json({
      message: error.status ? error.message : "خطا در دریافت جزئیات سفارش.",
    });
  }
};

// =========================================
// UPDATE ORDER STATUS
// =========================================

export const updateAdminOrderStatusController = async (req, res) => {
  try {
    const order = await updateAdminOrderStatus(req.params.id, req.body?.status, req.user.id);

    return res.status(200).json({
      message: "وضعیت سفارش با موفقیت تغییر کرد.",
      order,
    });
  } catch (error) {
    console.error("UPDATE ADMIN ORDER STATUS ERROR:", error);

    return res.status(error.status || 500).json({
      message: error.status ? error.message : "خطا در تغییر وضعیت سفارش.",
    });
  }
};

// =========================================
// UPDATE ORDER SHIPPING
// =========================================

export const updateAdminOrderShippingController = async (req, res) => {
  try {
    const order = await updateAdminOrderShipping(req.params.id, {
      shippingMethod: req.body?.shippingMethod,
      trackingCode: req.body?.trackingCode,
    }, req.user.id);

    return res.status(200).json({
      message: "اطلاعات ارسال سفارش با موفقیت ثبت شد.",
      order,
    });
  } catch (error) {
    console.error("UPDATE ADMIN ORDER SHIPPING ERROR:", error);

    return res.status(error.status || 500).json({
      message: error.status ? error.message : "خطا در ثبت اطلاعات ارسال سفارش.",
    });
  }
};

// =========================================
// DELETE ORDER
// =========================================

export const deleteAdminOrderController = async (req, res) => {
  try {
    const result = await deleteAdminOrder(req.params.id, req.user.id);

    return res.status(200).json({
      message: "سفارش با موفقیت حذف شد.",
      orderId: result.id,
    });
  } catch (error) {
    console.error("DELETE ADMIN ORDER ERROR:", error);

    return res.status(error.status || 500).json({
      message: error.status ? error.message : "خطا در حذف سفارش.",
    });
  }
};


// VERIFY REQUESTED PAYMENT FROM ADMIN PANEL
export const reconcileRequestedPaymentController = async (req, res) => {
  try {
    const result = await reconcileRequestedPaymentById(req.params.paymentId, req.user.id);
    return res.status(200).json({
      success: true,
      message: "وضعیت پرداخت با پاسخ تأیید زرین‌پال بررسی شد.",
      data: result,
    });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    if (status >= 500) {
      console.error("ADMIN PAYMENT RECONCILIATION ERROR:", {
        errorType: error?.name || "Error",
      });
    }
    return res.status(status).json({
      success: false,
      message: status >= 500 ? "بررسی پرداخت ناموفق بود؛ وضعیت سفارش حفظ شده است." : error.message,
    });
  }
};


// EXPIRE A STALE PAYMENT THAT WAS NEVER SENT TO THE GATEWAY
export const expireUnsentPaymentController = async (req, res) => {
  try {
    const result = await expireUnsentPayment(req.params.paymentId, req.user.id);
    return res.status(200).json({
      success: true,
      message: "تراکنش ارسال‌نشده بسته و موجودی سفارش آزاد شد.",
      data: result,
    });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    if (status >= 500) {
      console.error("EXPIRE UNSENT PAYMENT ERROR:", {
        errorType: error?.name || "Error",
      });
    }
    return res.status(status).json({
      success: false,
      message: status >= 500 ? "بستن تراکنش ناموفق بود؛ وضعیت سفارش حفظ شده است." : error.message,
    });
  }
};


export const getAdminAuditLogsController = async (req, res) => {
  try {
    const result = await getAdminAuditLogs({
      page: req.query.page,
      pageSize: req.query.pageSize,
      action: req.query.action,
      from: req.query.from,
      to: req.query.to,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    if (status >= 500) {
      console.error("GET ADMIN AUDIT LOGS ERROR:", { errorType: error?.name || "Error" });
    }
    return res.status(status).json({
      success: false,
      message: status >= 500 ? "دریافت سوابق مدیریتی ناموفق بود." : error.message,
    });
  }
};
