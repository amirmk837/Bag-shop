import { getUserById, verifyToken } from "../services/auth.service.js";

// =========================================
// READ TOKEN FROM COOKIE
// =========================================

const getTokenFromCookie = (req) => {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("auth_token="),
  );

  if (!authCookie) {
    return null;
  }

  return decodeURIComponent(authCookie.trim().slice("auth_token=".length));
};

// =========================================
// REQUIRE AUTH
// =========================================

export const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromCookie(req);

    if (!token) {
      return res.status(401).json({
        message: "احراز هویت الزامی است.",
      });
    }

    const payload = verifyToken(token);

    const userId = Number(payload?.sub);
    if (!Number.isSafeInteger(userId) || userId < 1) {
      return res.status(401).json({
        message: "توکن نامعتبر یا منقضی شده است.",
      });
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(401).json({
        message: "کاربر پیدا نشد.",
      });
    }

    // کاربر حذف منطقی یا غیرفعال شده
    if (!user.isActive || user.deletedAt) {
      return res.status(401).json({
        message: "حساب کاربری شما غیرفعال شده است.",
      });
    }

    // Responses behind authentication can contain personal or order data.
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("Pragma", "no-cache");

    req.user = user;

    next();
  } catch (error) {
    if (
      error?.name === "JsonWebTokenError" ||
      error?.name === "TokenExpiredError" ||
      error?.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "احراز هویت نامعتبر یا منقضی شده است.",
      });
    }

    console.error("AUTH MIDDLEWARE ERROR:", {
      errorType: error?.name || "Error",
    });

    return res.status(500).json({
      message: "بررسی وضعیت ورود در حال حاضر امکان‌پذیر نیست.",
    });
  }
};

// =========================================
// ADMIN
// =========================================

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({
      message: "دسترسی فقط برای مدیر مجاز است.",
    });
  }

  next();
};

// =========================================
// PERMISSION
// =========================================

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.user?.role === "ADMIN") {
      return next();
    }

    if (req.user?.permissions?.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      message: "شما مجوز انجام این عملیات را ندارید.",
    });
  };
};
