// src/routes/adminUser.routes.js

import express from "express";
import {
  getUserDetailController,
  getUsersController,
  updateUserController,
  deleteUserController,
} from "../controllers/user.controller.js";
import { requireAuth, requireAdmin, requirePermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

// تمام این بخش فقط برای ADMIN است.
router.use(requireAuth);

router.get("/", requirePermission("VIEW_CUSTOMERS"), getUsersController);

router.get("/:id", requirePermission("VIEW_CUSTOMERS"), getUserDetailController);

router.patch("/:id", requireAdmin, updateUserController);

router.delete("/:id", requireAdmin, deleteUserController);

export default router;
