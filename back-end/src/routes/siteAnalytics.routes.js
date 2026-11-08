import express from "express";
import { recordSiteVisitController } from "../controllers/analytics.controller.js";

const router = express.Router();
router.post("/visit", recordSiteVisitController);
export default router;
