import express from "express";

import {
  getProductsController,
  getProductByCodeController,
  createProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", getProductsController);

router.get("/:productCode", getProductByCodeController);

router.post("/", createProductController);

router.patch("/:productCode", updateProductController);

router.delete("/:productCode", deleteProductController);

export default router;
