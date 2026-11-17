import express from "express";

import {
  getCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

// مشاهده دسته‌بندی‌ها عمومی است؛ تغییرات فقط توسط مدیر انجام می‌شود.
router.get("/", getCategoriesController);

router.post("/", requireAuth, requirePermission("MANAGE_CATEGORIES"), createCategoryController);
router.patch("/:categoryId", requireAuth, requirePermission("MANAGE_CATEGORIES"), updateCategoryController);
router.delete("/:categoryId", requireAuth, requirePermission("MANAGE_CATEGORIES"), deleteCategoryController);

export default router;
