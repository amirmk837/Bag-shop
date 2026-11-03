const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getSiteSettings = async () => {
  const response = await fetch(`${API_URL}/site-settings`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "دریافت تنظیمات سایت ناموفق بود.");
  return result.data;
};

export const saveSiteSettings = async (values) => {
  const body = new FormData();
  for (const key of ["storeName", "phone", "headerText", "footerAbout", "footerCaption"]) {
    body.append(key, values[key] || "");
  }
  if (values.logoFile) body.append("logo", values.logoFile);
  if (values.footerLogoFile) body.append("footerLogo", values.footerLogoFile);
  const response = await fetch(`${API_URL}/site-settings`, {
    method: "PUT", credentials: "include", body,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "ذخیره تنظیمات سایت ناموفق بود.");
  return result.data;
};
