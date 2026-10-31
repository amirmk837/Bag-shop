import { getActiveShippingMethods } from "../services/shippingMethod.service.js";

export const getActiveShippingMethodsController = async (_req, res) => {
  try {
    const items = await getActiveShippingMethods();

    return res.status(200).json({ items });
  } catch (error) {
    console.error("خطا در دریافت روش‌های ارسال فعال:", error);

    return res.status(500).json({
      message: "خطا در دریافت روش‌های ارسال.",
    });
  }
};
