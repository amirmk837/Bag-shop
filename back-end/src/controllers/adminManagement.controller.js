import {
  createManagedStaff, deleteManagedStaff, listManagedAdmins, updateManagedStaff,
} from "../services/adminManagement.service.js";

const handle = (fn) => async (req, res) => {
  try {
    const result = await fn(req);
    return res.status(200).json({ success: true, ...((result && typeof result === "object" && !Array.isArray(result)) ? result : { data: result }) });
  } catch (error) {
    return res.status(error?.status || (error?.code === "P2034" ? 409 : 400)).json({
      success: false,
      message: error?.code === "P2002" ? "نام کاربری یا شماره تماس تکراری است." : error.message || "عملیات مدیریت مدیران ناموفق بود.",
    });
  }
};

export const listManagedAdminsController = handle(() => listManagedAdmins());
export const createManagedStaffController = handle((req) => createManagedStaff({ ...req.body, actorId: req.user.id }));
export const updateManagedStaffController = handle((req) => updateManagedStaff({ ...req.body, targetId: req.params.id, actorId: req.user.id }));
export const deleteManagedStaffController = handle((req) => deleteManagedStaff({ targetId: req.params.id, actorId: req.user.id }));
