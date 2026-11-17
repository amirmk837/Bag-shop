// src/routes/adminUser.routes.js

import express from "express";
import {
  getUserDetailController,
  getUsersController,
  updateUserController,
  deleteUserController,
} from "../controllers/user.controller.js";
import { requireAuth, requirePermission } from "../middlewares/auth.middleware.js";

const router = express.Router();

// مشاهده و مدیریت مشتریان با مجوزهای جداگانه؛ مدیریت مدیران فقط ADMIN.
router.use(requireAuth);

router.get("/", requirePermission("VIEW_CUSTOMERS"), getUsersController);

router.get("/:id", requirePermission("VIEW_CUSTOMERS"), getUserDetailController);

router.patch("/:id", requirePermission("MANAGE_CUSTOMERS"), updateUserController);

router.delete("/:id", requirePermission("MANAGE_CUSTOMERS"), deleteUserController);

export default router;
