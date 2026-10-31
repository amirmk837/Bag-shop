const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.message || `درخواست ناموفق بود (${response.status})`);
  }

  return data;
};

export const startPayment = async ({ shippingMethodId } = {}) => {
  const numericShippingMethodId = Number(shippingMethodId);

  if (
    !Number.isSafeInteger(numericShippingMethodId) ||
    numericShippingMethodId <= 0
  ) {
    throw new Error("لطفاً یک روش ارسال معتبر انتخاب کنید.");
  }

  const result = await request(`${API_URL}/payments/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shippingMethodId: numericShippingMethodId,
    }),
  });

  const orderId = Number(result?.orderId);
  const rawPaymentUrl = result?.paymentUrl;

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new Error("شماره سفارش دریافتی از سرور معتبر نیست.");
  }

  let paymentUrl;

  try {
    paymentUrl = new URL(rawPaymentUrl);
  } catch {
    throw new Error("آدرس درگاه پرداخت معتبر نیست.");
  }

  if (paymentUrl.protocol !== "https:") {
    throw new Error("آدرس درگاه پرداخت باید امن باشد.");
  }

  return {
    orderId,
    paymentUrl: paymentUrl.toString(),
  };
};

export const getPaymentStatus = async (orderId) => {
  const numericOrderId = Number(orderId);

  if (!Number.isSafeInteger(numericOrderId) || numericOrderId <= 0) {
    throw new Error("شماره سفارش معتبر نیست.");
  }

  const result = await request(
    `${API_URL}/payments/orders/${numericOrderId}/status`,
  );

  if (!result?.data) {
    throw new Error("پاسخ وضعیت پرداخت معتبر نیست.");
  }

  return result.data;
};
