import { getAuthUserById, verifyToken } from "../services/auth.service.js";
import { getAnalyticsReport, getLoggedInUsers } from "../services/analytics.service.js";

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
