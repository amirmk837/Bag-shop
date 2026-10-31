import express from "express";
import {
  loginController,
  registerController,
  meController,
  logoutController,
} from "../controllers/auth.controller.js";
import {
  getAddressController,
  saveAddressController,
} from "../controllers/address.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireCustomer } from "../middlewares/customer.middleware.js";

const router = express.Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.get("/me", requireAuth, meController);
router.post("/logout", logoutController);

// آدرس ارسال فقط برای مشتری واردشده
router.get("/address", requireAuth, requireCustomer, getAddressController);
router.put("/address", requireAuth, requireCustomer, saveAddressController);

export default router;
