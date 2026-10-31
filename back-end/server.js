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

const app = express();

const PORT = process.env.PORT || 5000;

// =========================================
// MIDDLEWARE
// =========================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

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
// START SERVER
// =========================================

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
