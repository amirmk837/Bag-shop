const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "خطا در ارتباط با سبد خرید.");
  }

  return data;
};

export const getCart = async () => {
  return request(`${API_URL}/cart`, {
    cache: "no-store",
  });
};

export const addToCart = async (productCode, quantity = 1, color = "") => {
  return request(`${API_URL}/cart/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productCode,
      quantity,
      color,
    }),
  });
};

export const updateCartItem = async (productCode, quantity, color = "") => {
  const query = new URLSearchParams({ color });

  return request(
    `${API_URL}/cart/items/${encodeURIComponent(productCode)}?${query}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity }),
    },
  );
};

export const removeCartItem = async (productCode, color = "") => {
  const query = new URLSearchParams({ color });

  return request(
    `${API_URL}/cart/items/${encodeURIComponent(productCode)}?${query}`,
    { method: "DELETE" },
  );
};

export const clearCart = async () => {
  return request(`${API_URL}/cart`, {
    method: "DELETE",
  });
};
