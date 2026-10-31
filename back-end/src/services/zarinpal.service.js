import { config } from "../config/env.js";

const API_BASE = "https://payment.zarinpal.com/pg/v4/payment";
const SANDBOX_API_BASE = "https://sandbox.zarinpal.com/pg/v4/payment";

const isSandbox = () => config.ZARINPAL_SANDBOX;

const getApiBase = () => (isSandbox() ? SANDBOX_API_BASE : API_BASE);

const getStartPayUrl = (authority) => {
  const base = isSandbox()
    ? "https://sandbox.zarinpal.com/pg/StartPay"
    : "https://www.zarinpal.com/pg/StartPay";

  return `${base}/${encodeURIComponent(authority)}`;
};

const validateMerchantId = (merchantId) => {
  if (
    typeof merchantId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      merchantId.trim(),
    )
  ) {
    throw new Error("شناسه پذیرنده زرین‌پال معتبر نیست.");
  }
};

const validateAmount = (amountRial) => {
  if (
    !Number.isSafeInteger(amountRial) ||
    amountRial <= 0 ||
    amountRial > 2_147_483_647
  ) {
    throw new Error("مبلغ پرداخت به ریال معتبر نیست.");
  }
};

const postToZarinpal = async (endpoint, payload) => {
  let response;

  try {
    response = await fetch(`${getApiBase()}/${endpoint}.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("ارتباط با درگاه زرین‌پال برقرار نشد.");
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("پاسخ دریافتی از درگاه زرین‌پال معتبر نیست.");
  }

  if (!response.ok) {
    throw new Error("درخواست به درگاه زرین‌پال ناموفق بود.");
  }

  return result;
};

export const requestZarinpalPayment = async ({
  merchantId,
  amountRial,
  callbackUrl,
  description,
  metadata = {},
}) => {
  validateMerchantId(merchantId);
  validateAmount(amountRial);

  let parsedCallbackUrl;

  try {
    parsedCallbackUrl = new URL(callbackUrl);
  } catch {
    throw new Error("آدرس بازگشت پرداخت معتبر نیست.");
  }

  const isLocalhost =
    parsedCallbackUrl.hostname === "localhost" ||
    parsedCallbackUrl.hostname === "127.0.0.1";

  if (
    parsedCallbackUrl.protocol !== "https:" &&
    !(isSandbox() && isLocalhost && parsedCallbackUrl.protocol === "http:")
  ) {
    throw new Error("آدرس بازگشت پرداخت باید HTTPS باشد.");
  }

  const result = await postToZarinpal("request", {
    merchant_id: merchantId.trim(),
    amount: amountRial,
    callback_url: parsedCallbackUrl.toString(),
    description: String(description || "پرداخت سفارش فروشگاه کاظمی").slice(
      0,
      500,
    ),
    metadata,
  });

  const data = result?.data;

  if (
    Number(data?.code) !== 100 ||
    typeof data?.authority !== "string" ||
    !data.authority.trim()
  ) {
    throw new Error(
      `درگاه زرین‌پال درخواست پرداخت را نپذیرفت (کد: ${
        data?.code ?? "نامشخص"
      }).`,
    );
  }

  return {
    authority: data.authority.trim(),
    paymentUrl: getStartPayUrl(data.authority.trim()),
  };
};

export const verifyZarinpalPayment = async ({
  merchantId,
  amountRial,
  authority,
}) => {
  validateMerchantId(merchantId);
  validateAmount(amountRial);

  if (typeof authority !== "string" || !authority.trim()) {
    throw new Error("شناسه تراکنش زرین‌پال معتبر نیست.");
  }

  const result = await postToZarinpal("verify", {
    merchant_id: merchantId.trim(),
    amount: amountRial,
    authority: authority.trim(),
  });

  const data = result?.data;

  return {
    code: Number(data?.code),
    refId: data?.ref_id != null ? String(data.ref_id) : null,
    cardPan: data?.card_pan ?? null,
    message: data?.message ?? null,
  };
};
