import express from "express";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";
import { analyticsReportController, loggedInUsersController } from "../controllers/analytics.controller.js";

const router = express.Router();
router.use(requireAuth);
router.get("/report", requirePermission("VIEW_ANALYTICS"), analyticsReportController);
router.get("/logged-in-users", requirePermission("VIEW_ADMIN_ACTIVITY"), loggedInUsersController);
export default router;
