import { startCustomerPayment } from "../services/payment.service.js";
import { handleZarinpalCallback } from "../services/paymentCallback.service.js";
import { getCustomerPaymentStatus } from "../services/paymentStatus.service.js";

const getFrontendUrl = () => {
  const value = process.env.FRONTEND_URL?.trim();

  if (!value) {
    throw new Error("آدرس فرانت‌اند تنظیم نشده است.");
  }

  const url = new URL(value);

  const isLocalhost =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";

  if (url.protocol !== "https:" && !isLocalhost) {
    throw new Error("آدرس فرانت‌اند باید HTTPS باشد.");
  }

  return url;
};

const redirectToResult = (res, status, orderId) => {
  const redirectUrl = new URL("/payment/result", getFrontendUrl());

  redirectUrl.searchParams.set("status", status);

  if (orderId !== undefined && orderId !== null) {
    redirectUrl.searchParams.set("orderId", String(orderId));
  }

  return res.redirect(303, redirectUrl.toString());
};

export const startPaymentController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { shippingMethodId } = req.body ?? {};

    if (!userId) {
      return res.status(401).json({
        message: "برای شروع پرداخت وارد حساب کاربری شوید.",
      });
    }

    const numericShippingMethodId = Number(shippingMethodId);

    if (
      !Number.isSafeInteger(numericShippingMethodId) ||
      numericShippingMethodId <= 0
    ) {
      return res.status(400).json({
        message: "لطفاً یک روش ارسال معتبر انتخاب کنید.",
      });
    }

    const result = await startCustomerPayment(userId, numericShippingMethodId);

    return res.status(200).json({
      orderId: result.orderId,
      paymentUrl: result.paymentUrl,
    });
  } catch (error) {
    console.error("START PAYMENT ERROR:", {
      message: error?.message,
      status: error?.status,
    });

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "شروع پرداخت ناموفق بود؛ وضعیت سفارش را بررسی کنید.",
    });
  }
};

export const zarinpalCallbackController = async (req, res) => {
  try {
    const authority =
      typeof req.query.Authority === "string" ? req.query.Authority.trim() : "";
    const callbackStatus =
      typeof req.query.Status === "string" ? req.query.Status.trim() : "";

    if (!authority) {
      return redirectToResult(res, "error");
    }

    const result = await handleZarinpalCallback({ authority, callbackStatus });

    return redirectToResult(res, result.status, result.orderId);
  } catch (error) {
    console.error("ZARINPAL CALLBACK ERROR:", {
      errorType: error?.name || "Error",
      status: error?.status || 500,
    });

    try {
      return redirectToResult(res, "error");
    } catch (redirectError) {
      console.error("PAYMENT RESULT REDIRECT ERROR:", {
        message: redirectError?.message,
      });

      return res
        .status(503)
        .send(
          "نتیجه پرداخت مشخص نیست؛ وضعیت سفارش را از حساب کاربری بررسی کنید.",
        );
    }
  }
};

export const getPaymentStatusController = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const userId = Number(req.user?.id);

    const result = await getCustomerPaymentStatus({
      userId,
      orderId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;

    if (status >= 500) {
      console.error("GET PAYMENT STATUS ERROR:", error);
    }

    return res.status(status).json({
      success: false,
      message:
        status >= 500 ? "دریافت وضعیت پرداخت با خطا مواجه شد." : error.message,
    });
  }
};
