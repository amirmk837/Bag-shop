// src/controllers/user.controller.js
import {
  getUserDetail,
  getUsers,
  softDeleteUser,
  updateUser,
} from "../services/user.service.js";

// GET ALL USERS
// =========================================
export const getUsersController = async (req, res) => {
  try {
    const result = await getUsers({
      page: req.query.page,
      pageSize: req.query.pageSize,
      search: req.query.search,
      status: req.query.status,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return res.status(500).json({
      message: "خطا در دریافت کاربران.",
    });
  }
};

// GET USER DETAIL
// =========================================
export const getUserDetailController = async (req, res) => {
  try {
    const result = await getUserDetail(
      req.params.id,
      req.query.orderPage,
      req.query.orderPageSize,
    );

    if (!result) {
      return res.status(404).json({
        message: "کاربر پیدا نشد.",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("GET USER DETAIL ERROR:", error);

    return res.status(400).json({
      message: error.message || "خطا در دریافت اطلاعات کاربر.",
    });
  }
};

// UPDATE USER
// =========================================
export const updateUserController = async (req, res) => {
  try {
    const updatedUser = await updateUser({
      targetUserId: req.params.id,
      actorUserId: req.user.id,
      role: req.body.role,
      permissions: req.body.permissions,
      isActive: req.body.isActive,
    });

    return res.status(200).json({
      message: "اطلاعات کاربر با موفقیت بروزرسانی شد.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", {
      errorType: error?.name || "Error",
      code: error?.code || null,
    });

    return res.status(error?.code === "P2034" ? 409 : 400).json({
      message: error?.code === "P2034"
        ? "درخواست هم‌زمان دیگری در حال تغییر اطلاعات است؛ دوباره تلاش کنید."
        : error.message || "بروزرسانی کاربر ناموفق بود.",
    });
  }
};

// DELETE USER
// =========================================
export const deleteUserController = async (req, res) => {
  try {
    const deletedUser = await softDeleteUser(req.params.id, req.user.id);

    return res.status(200).json({
      message: "کاربر با موفقیت غیرفعال و حذف منطقی شد.",
      user: deletedUser,
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", {
      errorType: error?.name || "Error",
      code: error?.code || null,
    });

    return res.status(error?.code === "P2034" ? 409 : 400).json({
      message: error?.code === "P2034"
        ? "درخواست هم‌زمان دیگری در حال تغییر اطلاعات است؛ دوباره تلاش کنید."
        : error.message || "حذف کاربر ناموفق بود.",
    });
  }
};
