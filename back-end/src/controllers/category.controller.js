import { z } from "zod";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/category.service.js";

const categoryFields = {
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100),
  image: z.string().trim().max(2048).nullable().optional(),
};

const createCategorySchema = z.object(categoryFields).strict();
const updateCategorySchema = z
  .object(categoryFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "حداقل یک فیلد برای ویرایش ارسال کنید.",
  });

const sendValidationError = (res, validation, message) =>
  res.status(400).json({
    success: false,
    message,
    errors: validation.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });

// =================================================
// GET CATEGORIES
// =================================================

const getCategoriesController = async (_req, res) => {
  try {
    const categories = await getCategories();

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "خطا در دریافت دسته‌بندی‌ها",
    });
  }
};

// =================================================
// CREATE CATEGORY
// =================================================

const createCategoryController = async (req, res) => {
  const validation = createCategorySchema.safeParse(req.body);

  if (!validation.success) {
    return sendValidationError(
      res,
      validation,
      "اطلاعات دسته‌بندی نامعتبر است.",
    );
  }

  try {
    const category = await createCategory(validation.data);

    return res.status(201).json({
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

    return res.status(500).json({
      success: false,
      message: "خطا در ایجاد دسته‌بندی",
    });
  }
};

// =================================================
// UPDATE CATEGORY
// =================================================

const updateCategoryController = async (req, res) => {
  const categoryId = Number(req.params.categoryId);

  if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
    return res.status(400).json({
      success: false,
      message: "شناسه دسته‌بندی نامعتبر است",
    });
  }

  const validation = updateCategorySchema.safeParse(req.body);

  if (!validation.success) {
    return sendValidationError(
      res,
      validation,
      "اطلاعات ویرایش دسته‌بندی نامعتبر است.",
    );
  }

  try {
    const category = await updateCategory(categoryId, validation.data);

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
// DELETE CATEGORY
// =================================================

const deleteCategoryController = async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
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
