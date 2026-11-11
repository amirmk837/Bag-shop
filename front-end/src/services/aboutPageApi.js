const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}/about${path}`, {
    ...options,
    credentials: options.credentials || "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || "ارتباط با سرور ناموفق بود.");
    error.status = response.status;
    throw error;
  }
  return result.data;
};

export const getPublicAboutPage = () => request("/");
export const getAdminAboutPage = () => request("/admin", { credentials: "include" });
export const saveAboutPage = (data) => request("/admin", {
  method: "PUT",
  credentials: "include",
  body: JSON.stringify(data),
});
