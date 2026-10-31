const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const getAllowedOrigins = () => {
  const configured = process.env.FRONTEND_ORIGINS || "http://localhost:5173";
  return new Set(
    configured.split(",").map((value) => value.trim()).filter(Boolean),
  );
};

export const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const allowedOrigins = getAllowedOrigins();
  const originHeader = req.get("origin");
  const refererHeader = req.get("referer");

  let requestOrigin = originHeader;
  if (!requestOrigin && refererHeader) {
    try {
      requestOrigin = new URL(refererHeader).origin;
    } catch {
      requestOrigin = null;
    }
  }

  if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
    return res.status(403).json({
      success: false,
      message: "مبدأ درخواست معتبر نیست؛ درخواست رد شد.",
    });
  }

  return next();
};
