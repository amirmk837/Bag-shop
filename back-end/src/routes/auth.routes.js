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
import { createRateLimiter } from "../middlewares/rateLimit.middleware.js";

const limitLogin = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 8 });
const limitRegister = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 });
import { requireCustomer } from "../middlewares/customer.middleware.js";

const router = express.Router();

router.post("/login", limitLogin, loginController);
router.post("/register", limitRegister, registerController);
router.get("/me", requireAuth, meController);
router.post("/logout", requireAuth, logoutController);

// آدرس ارسال فقط برای مشتری واردشده
router.get("/address", requireAuth, requireCustomer, getAddressController);
router.put("/address", requireAuth, requireCustomer, saveAddressController);

export default router;
