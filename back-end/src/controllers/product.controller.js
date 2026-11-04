import {
  getProducts,
  getProductByCode,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/product.service.js";
import {
  productSchema,
  updateProductSchema,
} from "../validators/product.validator.js";

// =========================================
// GET /api/products
// =========================================

const getProductsController = async (req, res) => {
  try {
    const categorySlug = req.query.categorySlug;
    if (
      categorySlug !== undefined &&
      (typeof categorySlug !== "string" ||
        categorySlug.length > 100 ||
        !/^[a-z0-9-]+$/.test(categorySlug))
    ) {
      return res.status(400).json({
        success: false,
        message: "شناسه دسته‌بندی نامعتبر است",
      });
    }

    const products = await getProducts(
      categorySlug ? { categorySlug } : undefined,
    );

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "خطا در دریافت محصولات",
    });
  }
};

// =========================================
// GET /api/products/:productCode
// =========================================

const getProductByCodeController = async (req, res) => {
  try {
    const { productCode } = req.params;

    const product = await getProductByCode(productCode);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "محصول پیدا نشد",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      success: false,
      message: "خطا در دریافت محصول",
    });
  }
};

// =========================================
// POST /api/products
// =========================================

const createProductController = async (req, res) => {
  try {
    const validation = productSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "اطلاعات محصول نامعتبر است",
        errors: validation.error.issues,
      });
    }

    const product = await createProduct(validation.data);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (error.code === "CATEGORY_NOT_FOUND") {
      return res.status(400).json({
        success: false,
        message: "دسته‌بندی پیدا نشد",
      });
    }

    if (error.code === "DUPLICATE_COLOR") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "خطا در ایجاد محصول",
    });
  }
};

// =========================================
// PATCH /api/products/:productCode
// =========================================

const updateProductController = async (req, res) => {
  try {
    const { productCode } = req.params;

    const validation = updateProductSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "اطلاعات ویرایش نامعتبر است",
        errors: validation.error.issues,
      });
    }

    const product = await updateProduct(productCode, validation.data);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "محصول یا دسته‌بندی پیدا نشد",
      });
    }

    if (error.code === "CATEGORY_NOT_FOUND") {
      return res.status(400).json({
        success: false,
        message: "دسته‌بندی پیدا نشد",
      });
    }

    if (error.code === "DUPLICATE_COLOR") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "خطا در ویرایش محصول",
    });
  }
};

// =========================================
// DELETE /api/products/:productCode
// =========================================

const deleteProductController = async (req, res) => {
  try {
    const { productCode } = req.params;

    await deleteProduct(productCode);

    res.status(200).json({
      success: true,
      message: "محصول با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "محصول پیدا نشد",
      });
    }

    res.status(500).json({
      success: false,
      message: "خطا در حذف محصول",
    });
  }
};

export {
  getProductsController,
  getProductByCodeController,
  createProductController,
  updateProductController,
  deleteProductController,
};
