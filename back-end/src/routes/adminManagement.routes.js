import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireSuperAdmin } from "../middlewares/authorization.middleware.js";
import {
  createManagedStaffController, deleteManagedStaffController,
  listManagedAdminsController, updateManagedStaffController,
} from "../controllers/adminManagement.controller.js";

const router = express.Router();
router.use(requireAuth, requireSuperAdmin);
router.get("/", listManagedAdminsController);
router.post("/staff", createManagedStaffController);
router.patch("/staff/:id", updateManagedStaffController);
router.delete("/staff/:id", deleteManagedStaffController);
export default router;
