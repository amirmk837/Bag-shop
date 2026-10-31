import { getAuthUserById, getUserById, verifyToken } from "../services/auth.service.js";

// =========================================
// READ TOKEN FROM COOKIE
// =========================================

const getTokenFromCookie = (req) => {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) return null;

  const authCookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.startsWith("auth_token="));

  // Duplicate authentication cookies are ambiguous and must be rejected.
  if (authCookies.length !== 1) return null;

  const rawToken = authCookies[0].slice("auth_token=".length);
  if (!rawToken) return null;

  try {
    return decodeURIComponent(rawToken);
  } catch {
    // A malformed cookie is an unauthenticated request, not a server error.
    return null;
  }
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

    const authUser = await getAuthUserById(userId);

    if (!authUser) {
      return res.status(401).json({
        message: "کاربر پیدا نشد.",
      });
    }

    if (!authUser.isActive || authUser.deletedAt) {
      return res.status(401).json({
        message: "حساب کاربری شما غیرفعال شده است.",
      });
    }

    const tokenVersion = Number(payload?.tokenVersion);
    if (
      !Number.isSafeInteger(tokenVersion) ||
      tokenVersion < 0 ||
      tokenVersion !== authUser.tokenVersion
    ) {
      return res.status(401).json({
        message: "نشست شما معتبر نیست؛ دوباره وارد شوید.",
      });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(401).json({
        message: "کاربر پیدا نشد.",
      });
    }

    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("Pragma", "no-cache");

    req.user = user;
    return next();
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

  return next();
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
