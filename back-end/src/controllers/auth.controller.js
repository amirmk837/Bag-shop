import {
  createAuthToken,
  getUserById,
  loginUser,
  registerUser,
  auditFailedAdminLogin,
} from "../services/auth.service.js";

const COOKIE_NAME = "auth_token";

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
});

const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

// =========================================
// LOGIN
// =========================================

export const loginController = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "نام کاربری یا شماره تماس و رمز عبور الزامی است.",
      });
    }

    // loginUser خود User را برمی‌گرداند
    const user = await loginUser(identifier, password);

    if (!user) {
      return res.status(401).json({
        message: "اطلاعات ورود صحیح نیست.",
      });
    }

    // ساخت JWT بعد از تأیید رمز
    const token = createAuthToken(user);

    res.cookie(COOKIE_NAME, token, {
      ...getCookieOptions(),
      maxAge: COOKIE_MAX_AGE,
    });

    return res.status(200).json({
      message: "ورود با موفقیت انجام شد.",
      user,
    });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;

    if (status === 401) {
      try {
        await auditFailedAdminLogin(req.body?.identifier);
      } catch (auditError) {
        console.error("ADMIN LOGIN AUDIT ERROR:", { errorType: auditError?.name || "Error" });
      }
    }

    if (status >= 500) {
      console.error("LOGIN CONTROLLER ERROR:", {
        errorType: error?.name || "Error",
      });
    }

    return res.status(status).json({
      message: status >= 500
        ? "ورود در حال حاضر امکان‌پذیر نیست؛ دوباره تلاش کنید."
        : error.message,
    });
  }
};

// REGISTER
// =========================================
export const registerController = async (req, res) => {
  try {
    const { username, phone, password } = req.body;

    if (!username || !phone || !password) {
      return res.status(400).json({
        message: "نام کاربری، شماره تماس و رمز عبور الزامی است.",
      });
    }

    const user = await registerUser(username, phone, password);

    if (!user) {
      return res.status(400).json({
        message: "اطلاعات ثبت‌نام صحیح نیست.",
      });
    }

    const token = createAuthToken(user);

    res.cookie(COOKIE_NAME, token, {
      ...getCookieOptions(),
      maxAge: COOKIE_MAX_AGE,
    });

    return res.status(201).json({
      message: "حساب کاربری با موفقیت ساخته شد.",
      user,
    });
  } catch (error) {
    console.error("Register controller error:", error);

    return res.status(error.status || 400).json({
      message: error.message || "خطا در ساخت حساب کاربری.",
    });
  }
};

// ME
// =========================================
export const meController = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(401).json({
        message: "کاربر پیدا نشد.",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Me controller error:", error);

    return res.status(500).json({
      message: "خطا در دریافت اطلاعات کاربر.",
    });
  }
};

// LOGOUT
// =========================================
export const logoutController = (req, res) => {
  res.clearCookie(COOKIE_NAME, getCookieOptions());

  return res.status(200).json({
    message: "با موفقیت خارج شدید.",
  });
};
