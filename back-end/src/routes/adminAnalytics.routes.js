import express from "express";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";
import { analyticsReportController, loggedInUsersController } from "../controllers/analytics.controller.js";

const router = express.Router();
router.use(requireAuth, requirePermission("VIEW_ANALYTICS"));
router.get("/report", analyticsReportController);
router.get("/logged-in-users", requirePermission("VIEW_ADMIN_ACTIVITY"), loggedInUsersController);
export default router;
