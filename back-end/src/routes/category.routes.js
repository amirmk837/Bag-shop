import express from "express";

import {
  getCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// مشاهده دسته‌بندی‌ها عمومی است؛ تغییرات فقط توسط مدیر انجام می‌شود.
router.get("/", getCategoriesController);

router.post("/", requireAuth, requireAdmin, createCategoryController);
router.patch("/:categoryId", requireAuth, requireAdmin, updateCategoryController);
router.delete("/:categoryId", requireAuth, requireAdmin, deleteCategoryController);

export default router;
