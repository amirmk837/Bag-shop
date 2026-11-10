import express from "express";
import { popularProductsController, recordSiteVisitController } from "../controllers/analytics.controller.js";

const router = express.Router();
router.post("/visit", recordSiteVisitController);
router.get("/popular-products", popularProductsController);
export default router;
