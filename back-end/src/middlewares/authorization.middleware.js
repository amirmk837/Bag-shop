const ADMIN_ROLES = new Set(["ADMIN", "ADMIN_STAFF"]);

export const ADMIN_PERMISSIONS = Object.freeze([
  "MANAGE_PRODUCTS",
  "MANAGE_CATEGORIES",
  "VIEW_ORDERS",
  "MANAGE_ORDERS",
  "MANAGE_USERS",
  "RECONCILE_PAYMENTS",
  "VIEW_CUSTOMERS",
  "MANAGE_CUSTOMERS",
  "VIEW_ANALYTICS",
  "MANAGE_BANNERS",
  "MANAGE_CONTENT",
  "MANAGE_SITE_SETTINGS",
  "MANAGE_SOCIAL_LINKS",
  "MANAGE_SHIPPING_SETTINGS",
  "MODERATE_COMMENTS",
  "MANAGE_SUPPORT",
  "VIEW_AUDIT_LOGS",
  "VIEW_ADMIN_ACTIVITY",
]);

const forbidden = (res) => res.status(403).json({
  message: "شما مجوز انجام این عملیات را ندارید.",
});

export const requireAdminAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "احراز هویت الزامی است." });
  }

  if (!ADMIN_ROLES.has(req.user.role)) {
    return forbidden(res);
  }

  return next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "احراز هویت الزامی است." });
  }

  if (req.user.role !== "ADMIN") {
    return forbidden(res);
  }

  return next();
};

export const requirePermission = (permission) => {
  if (!ADMIN_PERMISSIONS.includes(permission)) {
    throw new Error(`Unknown admin permission: ${permission}`);
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "احراز هویت الزامی است." });
    }

    // ADMIN is the super administrator and always bypasses granular checks.
    if (req.user.role === "ADMIN") {
      return next();
    }

    // Never trust permissions attached to a customer account.
    if (
      req.user.role === "ADMIN_STAFF" &&
      Array.isArray(req.user.permissions) &&
      req.user.permissions.includes(permission)
    ) {
      return next();
    }

    return forbidden(res);
  };
};
