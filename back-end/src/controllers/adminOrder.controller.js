import {
  deleteAdminOrder,
  getAdminOrderDetail,
  getAdminOrders,
  updateAdminOrderStatus,
  updateAdminOrderShipping,
} from "../services/adminOrder.service.js";

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
    const order = await updateAdminOrderStatus(req.params.id, req.body?.status);

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
    });

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
    const result = await deleteAdminOrder(req.params.id);

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
