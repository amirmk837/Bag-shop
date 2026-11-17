import express from "express";

import {
  getPaymentReconciliationQueueController,
  getAdminAuditLogsController,
  expireUnsentPaymentController,
  reconcileRequestedPaymentController,
  archiveAdminOrderController,
  restoreAdminOrderController,
  updateAdminOrderItemInventoryReturnController,
  resolveInventoryReturnIssueController,
  getAdminOrderDetailController,
  getAdminOrdersController,
  updateAdminOrderShippingController,
  updateAdminOrderStatusController,
} from "../controllers/adminOrder.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdminAccess, requirePermission } from "../middlewares/authorization.middleware.js";

const router = express.Router();

router.use(requireAuth, requireAdminAccess);

router.get("/", requirePermission("VIEW_ORDERS"), getAdminOrdersController);
router.get("/payment-reconciliation", requirePermission("RECONCILE_PAYMENTS"), getPaymentReconciliationQueueController);
router.get("/audit-logs", requirePermission("VIEW_AUDIT_LOGS"), getAdminAuditLogsController);
router.post("/inventory-return-issues/:issueId/resolve", requirePermission("MANAGE_ORDERS"), resolveInventoryReturnIssueController);
router.post("/payment-reconciliation/:paymentId/verify", requirePermission("RECONCILE_PAYMENTS"), reconcileRequestedPaymentController);
router.post("/payment-reconciliation/:paymentId/expire-unsent", requirePermission("RECONCILE_PAYMENTS"), expireUnsentPaymentController);
router.get("/:id", requirePermission("VIEW_ORDERS"), getAdminOrderDetailController);

router.patch("/:id/status", requirePermission("MANAGE_ORDERS"), updateAdminOrderStatusController);
router.patch("/:id/shipping", requirePermission("MANAGE_ORDERS"), updateAdminOrderShippingController);
router.patch("/:id/items/:itemId/inventory-return", requirePermission("MANAGE_ORDERS"), updateAdminOrderItemInventoryReturnController);
router.post("/:id/archive", requirePermission("MANAGE_ORDERS"), archiveAdminOrderController);
router.post("/:id/restore", requirePermission("MANAGE_ORDERS"), restoreAdminOrderController);

export default router;
