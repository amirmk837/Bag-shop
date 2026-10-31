import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/category.service.js";

// =================================================
// GET CATEGORIES
// =================================================

const getCategoriesController = async (req, res) => {
  try {
    const categories = await getCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      success: false,
      message: "خطا در دریافت دسته‌بندی‌ها",
    });
  }
};

// =================================================
// CREATE CATEGORY
// =================================================

const createCategoryController = async (req, res) => {
  try {
    const category = await createCategory(req.body);

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "این نام یا slug قبلاً وجود دارد",
      });
    }

    res.status(500).json({
      success: false,
      message: "خطا در ایجاد دسته‌بندی",
    });
  }
};

// =================================================
// UPDATE CATEGORY
// =================================================

const updateCategoryController = async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "شناسه دسته‌بندی نامعتبر است",
      });
    }

    const { name, slug, image } = req.body;

    const category = await updateCategory(categoryId, {
      name,
      slug,
      image,
    });

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Update category error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "این نام یا slug قبلاً وجود دارد",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "دسته‌بندی پیدا نشد",
      });
    }

    return res.status(500).json({
      success: false,
      message: "خطا در ویرایش دسته‌بندی",
    });
  }
};

// =================================================
// // DELETE CATEGORY //
// =================================================

const deleteCategoryController = async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "شناسه دسته‌بندی نامعتبر است",
      });
    }

    const force = req.query.force === "true";

    const category = await deleteCategory(categoryId, force);

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Delete category error:", error);

    if (error.code === "CATEGORY_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "دسته‌بندی پیدا نشد",
      });
    }

    if (error.code === "CATEGORY_DELETE_CONFIRMATION_REQUIRED") {
      return res.status(409).json({
        success: false,
        message: "تأیید حذف دسته‌بندی لازم است",
        productCount: error.productCount,
      });
    }

    return res.status(500).json({
      success: false,
      message: "خطا در حذف دسته‌بندی",
    });
  }
};

export {
  getCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
};
