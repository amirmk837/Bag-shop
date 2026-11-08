const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

export const getCustomerOrders = async ({ signal } = {}) => {
  const response = await fetch(`${API_URL}/orders/my`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
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

  if (!Array.isArray(data?.orders)) {
    throw new Error("پاسخ سرور برای دریافت سفارش‌ها معتبر نیست.");
  }

  return data.orders;
};
