const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}/faq${path}`, {
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
    error.errors = result.errors || [];
    throw error;
  }
  return result.data;
};

export const getPublicFaq = () => request("/");
export const getAdminFaq = () => request("/admin", { credentials: "include" });
export const createFaq = (data) => request("/admin", {
  method: "POST",
  credentials: "include",
  body: JSON.stringify(data),
});
export const updateFaq = (id, data) => request(`/admin/${id}`, {
  method: "PUT",
  credentials: "include",
  body: JSON.stringify(data),
});
export const deleteFaq = (id) => request(`/admin/${id}`, {
  method: "DELETE",
  credentials: "include",
});
