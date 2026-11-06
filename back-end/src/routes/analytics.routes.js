import express from "express";
import { trackVisitController } from "../controllers/analytics.controller.js";
import { createRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();
const limitTracking = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 120 });
router.post("/track", limitTracking, trackVisitController);
export default router;
