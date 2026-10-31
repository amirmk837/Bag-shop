import express from "express";

import {
  getProductsController,
  getProductByCodeController,
  createProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller.js";

import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// =========================================
// Public Routes
// =========================================

// دریافت همه محصولات
router.get("/", getProductsController);

// دریافت یک محصول
router.get("/:productCode", getProductByCodeController);

// =========================================
// Protected Admin Routes
// =========================================

// ایجاد محصول
router.post("/", requireAuth, requireAdmin, createProductController);

// ویرایش محصول
router.patch(
  "/:productCode",
  requireAuth,
  requireAdmin,
  updateProductController,
);

// حذف محصول
router.delete(
  "/:productCode",
  requireAuth,
  requireAdmin,
  deleteProductController,
);

export default router;
