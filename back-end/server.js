import express from "express";
import cors from "cors";
import "dotenv/config";
import productRoutes from "./src/routes/product.routes.js";
import testRoutes from "./src/routes/test.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import categoryRoutes from "./src/routes/category.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";
import adminUserRoutes from "./src/routes/adminUser.routes.js";
import orderRoutes from "./src/routes/order.routes.js";
import adminOrderRoutes from "./src/routes/adminOrder.routes.js";
import adminDashboardRoutes from "./src/routes/adminDashboard.routes.js";
import bannerRoutes from "./src/routes/banner.routes.js";
import socialLinkRoutes from "./src/routes/socialLink.routes.js";
import paymentSettingsRoutes from "./src/routes/paymentSettings.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import adminShippingMethodRoutes from "./src/routes/adminShippingMethod.routes.js";
import shippingMethodRoutes from "./src/routes/shippingMethod.routes.js";
import { csrfProtection } from "./src/middlewares/csrf.middleware.js";
import { securityHeaders } from "./src/middlewares/securityHeaders.middleware.js";

const app = express();

const PORT = process.env.PORT || 5000;

// =========================================
// MIDDLEWARE
// =========================================

app.disable("x-powered-by");
app.use(securityHeaders);

const allowedFrontendOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedFrontendOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin is not allowed"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use("/api", csrfProtection);

// =========================================
// ROOT
// =========================================

app.get("/", (_req, res) => {
  res.send("Backend is working!");
});

// =========================================
// API ROUTES
// =========================================

app.use("/api", testRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/social-links", socialLinkRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/payment-settings", paymentSettingsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/shipping-methods", adminShippingMethodRoutes);
app.use("/api/shipping-methods", shippingMethodRoutes);

// بنرها؛ خواندن بنر فعال عمومی و مدیریت سایر عملیات فقط ادمین
app.use("/api/banners", bannerRoutes);

// ثبت سفارش توسط مشتری
app.use("/api/orders", orderRoutes); 
// =========================================
// STATIC FILES
// =========================================

app.use("/uploads", express.static("public/uploads"));

// =========================================
// NOT FOUND + CENTRAL ERROR HANDLING
// =========================================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "مسیر درخواستی پیدا نشد.",
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  console.error("Unhandled API error:", {
    method: req.method,
    path: req.path,
    message: error?.message,
  });

  const candidateStatus = error?.statusCode ?? error?.status;
  const statusCode =
    Number.isInteger(candidateStatus) &&
    candidateStatus >= 400 &&
    candidateStatus < 500
      ? candidateStatus
      : 500;

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500
      ? "خطای داخلی سرور رخ داد. لطفاً بعداً دوباره تلاش کنید."
      : "درخواست نامعتبر است.",
  });
});

// =========================================
// START SERVER
// =========================================

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
