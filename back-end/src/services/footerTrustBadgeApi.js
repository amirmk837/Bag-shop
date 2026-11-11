const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const request = async (url, options = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    credentials: "include",
    ...options,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "عملیات ناموفق بود.");
  }

  return result.data;
};

export const getAdminFooterTrustBadges = () =>
  request("/footer-trust-badges/admin");

export const createFooterTrustBadge = (values) => {
  const body = new FormData();

  body.append("title", values.title);
  body.append("altText", values.altText);
  body.append("linkUrl", values.linkUrl || "");
  body.append("sortOrder", String(values.sortOrder ?? 0));
  body.append("isActive", String(values.isActive !== false));
  body.append("image", values.image);

  return request("/footer-trust-badges/admin", {
    method: "POST",
    body,
  });
};

export const updateFooterTrustBadge = (id, values) => {
  const body = new FormData();

  for (const key of ["title", "altText", "linkUrl", "sortOrder", "isActive"]) {
    if (values[key] !== undefined) {
      body.append(key, String(values[key] ?? ""));
    }
  }

  if (values.image) {
    body.append("image", values.image);
  }

  return request(`/footer-trust-badges/admin/${id}`, {
    method: "PATCH",
    body,
  });
};

export const deleteFooterTrustBadge = (id) =>
  request(`/footer-trust-badges/admin/${id}`, {
    method: "DELETE",
  });
