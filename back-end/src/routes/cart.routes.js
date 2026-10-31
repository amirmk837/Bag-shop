import express from "express";
import {
  getCartController,
  addCartItemController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
} from "../controllers/cart.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireCustomer } from "../middlewares/customer.middleware.js";

const router = express.Router();

// تمام مسیرهای سبد خرید فقط برای مشتری واردشده مجاز هستند.
router.use(requireAuth, requireCustomer);
router.get("/", getCartController);
router.post("/items", addCartItemController);
router.patch("/items/:productCode", updateCartItemController);
router.delete("/items/:productCode", removeCartItemController);
router.delete("/", clearCartController);

export default router;
