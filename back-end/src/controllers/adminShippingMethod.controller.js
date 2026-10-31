import {
  getAdminShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
} from "../services/adminShippingMethod.service.js";

const handleError = (res, error, fallbackMessage) => {
  console.error(fallbackMessage, error);

  return res.status(error.status || 500).json({
    message: error.status ? error.message : fallbackMessage,
  });
};

export const getAdminShippingMethodsController = async (_req, res) => {
  try {
    const items = await getAdminShippingMethods();
    return res.status(200).json({ items });
  } catch (error) {
    return handleError(res, error, "خطا در دریافت روش‌های ارسال.");
  }
};

export const createShippingMethodController = async (req, res) => {
  try {
    const item = await createShippingMethod(req.body);
    return res.status(201).json({
      message: "روش ارسال ایجاد شد.",
      item,
    });
  } catch (error) {
    return handleError(res, error, "خطا در ایجاد روش ارسال.");
  }
};

export const updateShippingMethodController = async (req, res) => {
  try {
    const item = await updateShippingMethod(req.params.id, req.body);
    return res.status(200).json({
      message: "روش ارسال به‌روزرسانی شد.",
      item,
    });
  } catch (error) {
    return handleError(res, error, "خطا در ویرایش روش ارسال.");
  }
};

export const deleteShippingMethodController = async (req, res) => {
  try {
    const item = await deleteShippingMethod(req.params.id);
    return res.status(200).json({
      message: "روش ارسال حذف شد.",
      item,
    });
  } catch (error) {
    return handleError(res, error, "خطا در حذف روش ارسال.");
  }
};
