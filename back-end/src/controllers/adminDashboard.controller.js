import { getAdminDashboard } from "../services/adminDashboard.service.js";

export const getAdminDashboardController = async (req, res) => {
  try {
    const dashboard = await getAdminDashboard();

    return res.status(200).json(dashboard);
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      message: "دریافت اطلاعات داشبورد ناموفق بود.",
    });
  }
};
