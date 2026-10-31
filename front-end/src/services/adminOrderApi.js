const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
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

export const getAdminOrders = async ({
  page = 1,
  pageSize = 20,
  status = "all",
  search = "",
} = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    search,
  });

  if (status !== "all") params.set("status", status);

  const data = await request(`${API_URL}/admin/orders?${params.toString()}`);

  if (!Array.isArray(data?.items) || !data?.pagination) {
    throw new Error("پاسخ سرور برای دریافت فهرست سفارش‌ها معتبر نیست.");
  }

  return data;
};

export const getAdminOrderDetail = async (orderId) => {
  const data = await request(
    `${API_URL}/admin/orders/${encodeURIComponent(orderId)}`,
  );

  if (!data?.order) {
    throw new Error("جزئیات سفارش در پاسخ سرور موجود نیست.");
  }

  return data.order;
};

export const updateAdminOrderStatus = async (orderId, status) => {
  const url = `${API_URL}/admin/orders/${encodeURIComponent(orderId)}/status`;

  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  const data = await response.json().catch(() => null);

  console.log("Order status update:", {
    orderId,
    requestedStatus: status,
    httpStatus: response.status,
    response: data,
  });

  if (!response.ok) {
    throw new Error(
      data?.message || `خطا در ارتباط با سرور (${response.status})`,
    );
  }

  return data;
};

export const updateAdminOrderShipping = async (
  orderId,
  { shippingMethod, trackingCode },
) => {
  return request(
    `${API_URL}/admin/orders/${encodeURIComponent(orderId)}/shipping`,
    {
      method: "PATCH",
      body: JSON.stringify({ shippingMethod, trackingCode }),
    },
  );
};

export const deleteAdminOrder = async (orderId) => {
  return request(`${API_URL}/admin/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
  });
};
