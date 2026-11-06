const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const request = async (path) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "دریافت اطلاعات آمار ناموفق بود.");
  return data;
};

export const getAnalyticsReport = (days = 30) =>
  request(`/admin/analytics/report?days=${encodeURIComponent(days)}`);

export const getLoggedInUsers = ({ page = 1, pageSize = 20 } = {}) =>
  request(`/admin/analytics/logged-in-users?page=${page}&pageSize=${pageSize}`);
