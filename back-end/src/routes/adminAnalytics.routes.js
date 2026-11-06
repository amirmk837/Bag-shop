import express from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { analyticsReportController, loggedInUsersController } from "../controllers/analytics.controller.js";

const router = express.Router();
router.use(requireAuth, requireAdmin);
router.get("/report", analyticsReportController);
router.get("/logged-in-users", loggedInUsersController);
export default router;
