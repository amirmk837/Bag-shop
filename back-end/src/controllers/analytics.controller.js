import { getAuthUserById, verifyToken } from "../services/auth.service.js";
import { getAnalyticsReport, getLoggedInUsers, recordVisit } from "../services/analytics.service.js";

const readOptionalUser = async (req) => {
  const matches = (req.headers.cookie || "").split(";").map((part) => part.trim()).filter((part) => part.startsWith("auth_token="));
  if (matches.length !== 1) return null;
  try {
    const token = decodeURIComponent(matches[0].slice("auth_token=".length));
    const payload = verifyToken(token);
    const id = Number(payload?.sub);
    if (!Number.isSafeInteger(id) || id < 1) return null;
    const user = await getAuthUserById(id);
    if (!user || !user.isActive || user.deletedAt || user.tokenVersion !== payload.tokenVersion) return null;
    return id;
  } catch {
    return null;
  }
};

const classifyAgent = (value = "") => {
  const ua = value.toLowerCase();
  const deviceType = /tablet|ipad/.test(ua) ? "تبلت" : /mobile|android|iphone/.test(ua) ? "موبایل" : "دسکتاپ";
  const operatingSystem = /windows/.test(ua) ? "Windows" : /android/.test(ua) ? "Android" : /iphone|ipad|ios/.test(ua) ? "iOS" : /mac os|macintosh/.test(ua) ? "macOS" : /linux/.test(ua) ? "Linux" : "سایر";
  const browser = /edg\//.test(ua) ? "Edge" : /firefox\//.test(ua) ? "Firefox" : /opr\//.test(ua) ? "Opera" : /chrome\//.test(ua) ? "Chrome" : /safari\//.test(ua) ? "Safari" : "سایر";
  return { deviceType, operatingSystem, browser };
};

export const trackVisitController = async (req, res) => {
  const { visitorId, path, referrerHost } = req.body || {};
  if (typeof visitorId !== "string" || !/^[0-9a-f-]{36}$/i.test(visitorId) ||
      typeof path !== "string" || !path.startsWith("/") || path.length > 180 ||
      path.startsWith("//") || path.includes("?") || path.includes("#")) {
    return res.status(400).json({ message: "اطلاعات بازدید معتبر نیست." });
  }
  const host = typeof referrerHost === "string" && referrerHost.length <= 255 &&
    /^[a-z0-9.-]+$/i.test(referrerHost) ? referrerHost.toLowerCase() : null;
  try {
    await recordVisit({
      visitorId, path, referrerHost: host, userId: await readOptionalUser(req),
      ...classifyAgent(req.get("user-agent")),
    });
    return res.status(202).json({ accepted: true });
  } catch (error) {
    console.error("Visit tracking failed:", { errorType: error?.name || "Error" });
    return res.status(503).json({ message: "ثبت بازدید موقتاً در دسترس نیست." });
  }
};

export const analyticsReportController = async (req, res) => {
  try { return res.json(await getAnalyticsReport(req.query.days)); }
  catch (error) {
    console.error("Analytics report failed:", { errorType: error?.name || "Error" });
    return res.status(500).json({ message: "دریافت آمار سایت ناموفق بود." });
  }
};

export const loggedInUsersController = async (req, res) => {
  try { return res.json(await getLoggedInUsers(req.query)); }
  catch (error) {
    console.error("Logged-in users report failed:", { errorType: error?.name || "Error" });
    return res.status(500).json({ message: "دریافت فهرست کاربران واردشده ناموفق بود." });
  }
};
