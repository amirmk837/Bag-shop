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

export const trackAdminPageVisit = (path) => {
  if (typeof path !== "string" || !path.startsWith("/admin") || path === "/admin/login") return;

  fetch(`${API_URL}/admin/analytics/page-visits`, {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: path.slice(0, 500) }),
  }).catch(() => {});
};

export const getRecentAdminPageVisits = async () => {
  const data = await request("/admin/analytics/my-page-visits");
  return Array.isArray(data?.items) ? data.items : [];
};
