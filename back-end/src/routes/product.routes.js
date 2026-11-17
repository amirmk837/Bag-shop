import express from "express";

import {
  getProductsController,
  getProductByCodeController,
  createProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller.js";

import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";
import { popularProductsController } from "../controllers/analytics.controller.js";

const router = express.Router();

// =========================================
// Public Routes
// =========================================

// دریافت همه محصولات
router.get("/", getProductsController);

// Popular products must be registered before the dynamic product-code route.
router.get("/popular", popularProductsController);

// دریافت یک محصول
router.get("/:productCode", getProductByCodeController);

// =========================================
// Protected Admin Routes
// =========================================

// ایجاد محصول
router.post("/", requireAuth, requirePermission("MANAGE_PRODUCTS"), createProductController);

// ویرایش محصول
router.patch(
  "/:productCode",
  requireAuth,
  requirePermission("MANAGE_PRODUCTS"),
  updateProductController,
);

// حذف محصول
router.delete(
  "/:productCode",
  requireAuth,
  requirePermission("MANAGE_PRODUCTS"),
  deleteProductController,
);

export default router;
