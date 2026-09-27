import express from "express";
import cors from "cors";
import "dotenv/config";
import productRoutes from "./src/routes/product.routes.js";
import testRoutes from "./src/routes/test.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import categoryRoutes from "./src/routes/category.routes.js";

const app = express();

const PORT = process.env.PORT || 5000;

// =========================================
// Middleware
// =========================================

app.use(cors());
app.use(express.json());

// =========================================
// Root Route
// =========================================

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// =========================================
// API Routes
// =========================================

app.use("/api", testRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoryRoutes);

// =========================================
// Start Server
// =========================================

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});

app.use("/uploads", express.static("public/uploads"));
