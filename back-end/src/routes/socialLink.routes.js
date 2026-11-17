import express from "express";
import {
  createSocialLinkController,
  deleteSocialLinkController,
  getAdminSocialLinksController,
  getPublicSocialLinksController,
  saveSocialLinkController,
} from "../controllers/socialLink.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getPublicSocialLinksController);
router.use(requireAuth, requirePermission("MANAGE_SOCIAL_LINKS"));
router.get("/admin", getAdminSocialLinksController);
router.post("/admin", createSocialLinkController);
router.put("/admin/:platform", saveSocialLinkController);
router.delete("/admin/:platform", deleteSocialLinkController);

export default router;
