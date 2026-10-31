import express from "express";

import {
  getCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller.js";

const router = express.Router();

router.get("/", getCategoriesController);

router.post("/", createCategoryController);

router.patch("/:categoryId", updateCategoryController);

router.delete("/:categoryId", deleteCategoryController);

export default router;
