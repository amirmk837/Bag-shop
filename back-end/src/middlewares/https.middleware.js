import { config } from "../config/env.js";

export const requireHttpsInProduction = (req, res, next) => {
  if (config.NODE_ENV !== "production") return next();

  if (!req.secure) {
    return res.status(426).json({
      success: false,
      message: "اتصال امن HTTPS برای این سرویس الزامی است.",
    });
  }

  return next();
};
