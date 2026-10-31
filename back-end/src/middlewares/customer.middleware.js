export const requireCustomer = (req, res, next) => {
  if (req.user?.role !== "USER") {
    return res.status(403).json({
      message: "این بخش فقط برای حساب مشتری قابل استفاده است.",
    });
  }

  next();
};
