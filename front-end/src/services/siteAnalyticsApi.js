const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const VISITOR_STORAGE_KEY = "bag-store-visitor";
const ANALYTICS_OPT_OUT_KEY = "bag-store-analytics-opt-out";

const getVisitorId = () => {
  try {
    if (localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true") return null;

    const now = Date.now();
    const stored = JSON.parse(localStorage.getItem(VISITOR_STORAGE_KEY) || "null");
    if (stored?.id && Number(stored.expiresAt) > now) return stored.id;

    const id = window.crypto?.randomUUID?.();
    if (!id) return null;

    localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify({
      id,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    }));
    return id;
  } catch {
    return null;
  }
};

export const trackPageView = (path) => {
  const visitorId = getVisitorId();
  if (!visitorId || typeof path !== "string") return;

  fetch(`${API_URL}/analytics/visit`, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId, path: path.slice(0, 180) }),
  }).catch(() => {});
};


export const isAnalyticsOptedOut = () => {
  try {
    return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true";
  } catch {
    return false;
  }
};

export const setAnalyticsOptOut = (disabled) => {
  try {
    if (disabled) {
      localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "true");
      localStorage.removeItem(VISITOR_STORAGE_KEY);
    } else {
      localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
    }
    return true;
  } catch {
    return false;
  }
};
