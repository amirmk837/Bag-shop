const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const login = async (identifier, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      identifier,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "ورود ناموفق بود.");
  }

  return data;
};

export const registerCustomer = async (username, phone, password) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username,
      phone,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "ثبت‌نام ناموفق بود.");
  }

  return data;
};

export const getMe = async () => {
  const response = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "خطا در بررسی احراز هویت.");
  }

  return data.user;
};

export const logout = async () => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "خروج ناموفق بود.");
  }

  return data;
};
