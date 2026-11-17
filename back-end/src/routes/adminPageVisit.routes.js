import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  requireAdminAccess,
  requirePermission,
} from "../middlewares/authorization.middleware.js";
import {
  getRecentAdminPageVisitsController,
  recordAdminPageVisitController,
} from "../controllers/adminPageVisit.controller.js";

const router = express.Router();

router.use(requireAuth, requireAdminAccess);
router.post("/page-visits", recordAdminPageVisitController);
router.get(
  "/my-page-visits",
  requirePermission("VIEW_ADMIN_ACTIVITY"),
  getRecentAdminPageVisitsController,
);

export default router;
