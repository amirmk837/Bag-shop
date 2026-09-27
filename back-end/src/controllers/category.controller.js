import { getCategories, createCategory } from "../services/category.service.js";

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
        message: "این دسته‌بندی قبلاً وجود دارد",
      });
    }

    res.status(500).json({
      success: false,
      message: "خطا در ایجاد دسته‌بندی",
    });
  }
};

export { getCategoriesController, createCategoryController };
