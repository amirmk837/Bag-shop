import express from "express";

import {
  deleteAdminOrderController,
  getAdminOrderDetailController,
  getAdminOrdersController,
  updateAdminOrderShippingController,
  updateAdminOrderStatusController,
} from "../controllers/adminOrder.controller.js";

import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", getAdminOrdersController);
router.get("/:id", getAdminOrderDetailController);

router.patch("/:id/status", updateAdminOrderStatusController);
router.patch("/:id/shipping", updateAdminOrderShippingController);

router.delete("/:id", deleteAdminOrderController);

export default router;
