const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getAdminDashboard = async () => {
  const response = await fetch(`${API_URL}/admin/dashboard`, {
    method: "GET",
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "دریافت اطلاعات داشبورد ناموفق بود.");
  }

  return data;
};
