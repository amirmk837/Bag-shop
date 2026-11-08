const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const VISITOR_STORAGE_KEY = "bag-store-visitor";

const getVisitorId = () => {
  try {
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
