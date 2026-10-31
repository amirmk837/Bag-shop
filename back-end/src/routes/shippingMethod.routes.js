import express from "express";
import { getActiveShippingMethodsController } from "../controllers/shippingMethod.controller.js";

const router = express.Router();

router.get("/active", getActiveShippingMethodsController);

export default router;
