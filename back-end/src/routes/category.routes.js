import express from "express";

import {
  getCategoriesController,
  createCategoryController,
} from "../controllers/category.controller.js";

const router = express.Router();

router.get("/", getCategoriesController);

router.post("/", createCategoryController);

export default router;
