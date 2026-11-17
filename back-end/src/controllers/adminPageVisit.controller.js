import {
  getRecentAdminPageVisits,
  recordAdminPageVisit,
} from "../services/adminPageVisit.service.js";

export const recordAdminPageVisitController = async (req, res) => {
  try {
    await recordAdminPageVisit({
      adminId: req.user.id,
      path: req.body?.path,
    });
    return res.status(204).end();
  } catch (error) {
    console.error("ADMIN PAGE VISIT TRACKING ERROR:", {
      errorType: error?.name || "Error",
    });
    return res.status(204).end();
  }
};

export const getRecentAdminPageVisitsController = async (req, res) => {
  try {
    const items = await getRecentAdminPageVisits(req.user.id);
    return res.status(200).json({ items });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    if (status >= 500) {
      console.error("GET ADMIN PAGE VISITS ERROR:", {
        errorType: error?.name || "Error",
      });
    }
    return res.status(status).json({
      message: status >= 500 ? "دریافت صفحات اخیر مدیر ناموفق بود." : error.message,
    });
  }
};
