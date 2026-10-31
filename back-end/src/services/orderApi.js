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
    throw new Error(
      data?.message || `خطا در ارتباط با سرور (${response.status})`,
    );
  }

  return data;
};

export const createOrder = async () => {
  const data = await request(`${API_URL}/orders`, {
    method: "POST",
  });

  if (!data?.order?.id) {
    throw new Error("پاسخ سرور برای ثبت سفارش معتبر نیست.");
  }

  return data;
};

export const getCustomerOrders = async () => {
  const data = await request(`${API_URL}/orders/my`);

  if (!Array.isArray(data?.orders)) {
    throw new Error("پاسخ سرور برای دریافت سفارش‌ها معتبر نیست.");
  }

  return data.orders;
};
