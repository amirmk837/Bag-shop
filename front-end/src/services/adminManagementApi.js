const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}/admin/management${path}`, {
    ...options,
    credentials: "include",
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "عملیات مدیریت مدیران ناموفق بود.");
  return data;
};

export const getManagedAdmins = () => request("/");
export const createManagedStaff = (payload) => request("/staff", { method: "POST", body: JSON.stringify(payload) });
export const updateManagedStaff = (id, payload) => request(`/staff/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteManagedStaff = (id) => request(`/staff/${id}`, { method: "DELETE" });
