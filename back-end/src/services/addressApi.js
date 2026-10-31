const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// =========================================
// REQUEST
// =========================================

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "خطا در ارتباط با آدرس.");
  }

  return data;
};

// =========================================
// GET ADDRESS
// =========================================

export const getAddress = async () => {
  const data = await request(`${API_URL}/auth/address`);

  return data.address;
};

// =========================================
// SAVE ADDRESS
// =========================================

export const saveAddress = async (address) => {
  const data = await request(`${API_URL}/auth/address`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(address),
  });

  return data.address;
};
