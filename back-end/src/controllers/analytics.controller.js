import { getAuthUserById, verifyToken } from "../services/auth.service.js";
import { getAnalyticsReport, getLoggedInUsers, getMostViewedProducts, recordSiteVisit } from "../services/analytics.service.js";

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

export const recordSiteVisitController = async (req, res) => {
  try {
    await recordSiteVisit({
      visitorId: req.body?.visitorId,
      path: req.body?.path,
      userAgent: req.get("user-agent"),
      referer: req.get("referer"),
    });
    return res.status(204).end();
  } catch (error) {
    console.error("Site visit tracking failed:", { errorType: error?.name || "Error" });
    return res.status(204).end();
  }
};

export const popularProductsController = async (req, res) => {
  try {
    const products = await getMostViewedProducts(req.query.days);
    return res.json({ items: products, rangeDays: Math.min(Math.max(Number(req.query.days) || 30, 1), 90) });
  } catch (error) {
    console.error("Popular products report failed:", { errorType: error?.name || "Error" });
    return res.status(500).json({ message: "دریافت محصولات پربازدید ناموفق بود." });
  }
};
