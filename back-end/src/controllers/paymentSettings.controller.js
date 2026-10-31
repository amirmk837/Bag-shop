import {
  getPaymentSettings,
  updatePaymentSettings,
} from "../services/paymentSettings.service.js";

const isValidMerchantId = (value) => {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
};

export const getPaymentSettingsController = async (_req, res) => {
  try {
    const settings = await getPaymentSettings();
    const merchantId = settings?.merchantId?.trim() ?? "";

    return res.status(200).json({
      provider: "ZARINPAL",
      merchantId,
      isEnabled: false,
      configured: isValidMerchantId(merchantId),
    });
  } catch (error) {
    console.error("Get payment settings error:", error);

    return res.status(500).json({
      message: "دریافت تنظیمات پرداخت ناموفق بود.",
    });
  }
};

export const updatePaymentSettingsController = async (req, res) => {
  try {
    const merchantId =
      typeof req.body?.merchantId === "string"
        ? req.body.merchantId.trim()
        : "";

    // شناسه خالی یا شناسه با قالب نامعتبر پذیرفته نمی‌شود.
    if (!isValidMerchantId(merchantId)) {
      return res.status(400).json({
        message: "شناسه پذیرنده الزامی است و باید در قالب UUID معتبر وارد شود.",
      });
    }

    const settings = await updatePaymentSettings(merchantId);
    const savedMerchantId = settings?.merchantId?.trim() ?? "";

    if (savedMerchantId !== merchantId) {
      console.error("Payment settings verification failed.");

      return res.status(500).json({
        message: "ذخیره و بررسی تنظیمات پرداخت ناموفق بود.",
      });
    }

    return res.status(200).json({
      message: "شناسه پذیرنده ذخیره شد؛ پرداخت آنلاین همچنان غیرفعال است.",
      provider: "ZARINPAL",
      merchantId: savedMerchantId,
      isEnabled: false,
      configured: isValidMerchantId(savedMerchantId),
    });
  } catch (error) {
    console.error("Update payment settings error:", error);

    return res.status(500).json({
      message: "ذخیره تنظیمات پرداخت ناموفق بود.",
    });
  }
};
