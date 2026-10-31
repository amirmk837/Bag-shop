import express from "express";
import {
  getAdminShippingMethodsController,
  createShippingMethodController,
  updateShippingMethodController,
  deleteShippingMethodController,
} from "../controllers/adminShippingMethod.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", getAdminShippingMethodsController);
router.post("/", createShippingMethodController);
router.patch("/:id", updateShippingMethodController);
router.delete("/:id", deleteShippingMethodController);

export default router;
