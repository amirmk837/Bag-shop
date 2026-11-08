const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

// این درخواست‌ها مخصوص مرورگر هستند و نباید از پوشه سورس بک‌اند وارد شوند.
const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.message || `درخواست ناموفق بود (${response.status})`);
  }

  if (!data) {
    throw new Error("پاسخ سرور معتبر نیست.");
  }

  return data;
};

export const getAddress = async () => {
  const data = await request("/auth/address");
  return data.address;
};

export const saveAddress = async (address) => {
  const data = await request("/auth/address", {
    method: "PUT",
    body: JSON.stringify(address),
  });
  return data.address;
};
