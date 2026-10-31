const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const toAbsoluteUrl = (url) => {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const normalizeBanner = (banner) => {
  if (!banner) return null;

  const legacyImage = banner.imageUrl || "";

  return {
    ...banner,
    imageUrl: toAbsoluteUrl(legacyImage),
    desktopImageUrl: toAbsoluteUrl(banner.desktopImageUrl || legacyImage),
    mobileImageUrl: toAbsoluteUrl(
      banner.mobileImageUrl || banner.desktopImageUrl || legacyImage,
    ),
  };
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(`پاسخ نامعتبر از سرور دریافت شد (${response.status}).`);
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "ارتباط با سرور ناموفق بود.");
  }

  return result;
};

// =========================================
// PUBLIC: ACTIVE BANNER
// =========================================

export const getActiveBanners = async () => {
  const result = await request(`${API_URL}/banners/active`);

  return (result.data || []).map(normalizeBanner);
};

// =========================================
// ADMIN: GET BANNERS
// =========================================

export const getAdminBanners = async () => {
  const result = await request(`${API_URL}/banners`);

  return (result.data || []).map(normalizeBanner);
};

// =========================================
// ADMIN: CREATE BANNER
// =========================================

export const createBanner = async ({
  desktopFile,
  mobileFile,
  name,
  linkUrl,
  fit,
  isActive,
}) => {
  const formData = new FormData();

  formData.append("desktopImage", desktopFile);
  formData.append("mobileImage", mobileFile);
  formData.append("name", name);
  formData.append("linkUrl", linkUrl || "");
  formData.append("fit", fit);
  formData.append("isActive", String(isActive));

  const result = await request(`${API_URL}/banners`, {
    method: "POST",
    body: formData,
  });

  return normalizeBanner(result.data);
};

// =========================================
// ADMIN: UPDATE SETTINGS
// =========================================

export const updateBanner = async (id, data) => {
  const result = await request(`${API_URL}/banners/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return normalizeBanner(result.data);
};

// =========================================
// ADMIN: ACTIVATE BANNER
// =========================================

export const activateBanner = async (id) => {
  const result = await request(`${API_URL}/banners/${id}/activate`, {
    method: "PATCH",
  });

  return normalizeBanner(result.data);
};

// =========================================
// ADMIN: DELETE BANNER
// =========================================

export const deleteBanner = async (id) => {
  return request(`${API_URL}/banners/${id}`, {
    method: "DELETE",
  });
};
