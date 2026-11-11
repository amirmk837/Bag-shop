const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const request = async (path, options = {}, includeMeta = false) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: options.method && options.method !== "GET" ? "no-store" : "no-store",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || `خطای سرور (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return includeMeta ? data : data?.data ?? data;
};

export const getProductComments = (productCode, page = 1) =>
  request(`/products/${encodeURIComponent(productCode)}/comments?page=${page}&limit=50`, {}, true);

export const submitProductComment = (productCode, payload) =>
  request(`/products/${encodeURIComponent(productCode)}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getSupportTickets = () => request("/support");

export const getSupportTicket = (id) => request(`/support/${id}`);

export const createSupportTicket = (payload) =>
  request("/support", { method: "POST", body: JSON.stringify(payload) });

export const sendSupportMessage = (id, content) =>
  request(`/support/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const getAdminProductComments = (params = {}) => {
  const query = new URLSearchParams(params);
  return request(`/admin/product-comments?${query.toString()}`, {}, true);
};

export const updateAdminProductComment = (id, payload) =>
  request(`/admin/product-comments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteAdminProductComment = (id) =>
  request(`/admin/product-comments/${id}`, { method: "DELETE" });

export const getAdminSupportTickets = (params = {}) => {
  const query = new URLSearchParams(params);
  return request(`/admin/support?${query.toString()}`, {}, true);
};

export const getAdminSupportTicket = (id) => request(`/admin/support/${id}`);

export const replyAdminSupportTicket = (id, content) =>
  request(`/admin/support/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const updateAdminSupportTicket = (id, payload) =>
  request(`/admin/support/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const getAdminFeedbackSummary = () => request("/admin/feedback-summary");


export const getSupportSettings = () => request("/support/settings");

export const updateSupportSettings = (payload) =>
  request("/admin/support/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });


export const deleteAdminSupportTicket = (id) =>
  request(`/admin/support/${id}`, { method: "DELETE" });
