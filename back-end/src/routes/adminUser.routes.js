// src/routes/adminUser.routes.js

import express from "express";
import {
  getUserDetailController,
  getUsersController,
  updateUserController,
  deleteUserController,
} from "../controllers/user.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// تمام این بخش فقط برای ADMIN است.
router.use(requireAuth, requireAdmin);

router.get("/", getUsersController);

router.get("/:id", getUserDetailController);

router.patch("/:id", updateUserController);

router.delete("/:id", deleteUserController);

export default router;
