import prisma from "../config/prisma.js";

// =================================================
// GET CATEGORIES
// =================================================

const getCategories = async () => {
  return prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
};

// =================================================
// CREATE CATEGORY
// =================================================

const createCategory = async (data) => {
  return prisma.category.create({
    data,
  });
};

// =================================================
// UPDATE CATEGORY
// =================================================

const updateCategory = async (categoryId, data) => {
  return prisma.category.update({
    where: {
      id: categoryId,
    },
    data,
  });
};

// =================================================
// DELETE CATEGORY
// =================================================

const deleteCategory = async (categoryId, force = false) => {
  return prisma.$transaction(async (tx) => {
    const category = await tx.category.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        id: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      const error = new Error("دسته‌بندی پیدا نشد");

      error.code = "CATEGORY_NOT_FOUND";

      throw error;
    }

    const productCount = category._count.products;

    // بدون تأیید، هیچ Categoryای حذف نشود
    if (!force) {
      const error = new Error("تأیید حذف دسته‌بندی لازم است");

      error.code = "CATEGORY_DELETE_CONFIRMATION_REQUIRED";
      error.productCount = productCount;

      throw error;
    }

    // اگر محصول دارد، محصولات هم حذف شوند
    if (productCount > 0) {
      await tx.product.deleteMany({
        where: {
          categoryId,
        },
      });
    }

    return tx.category.delete({
      where: {
        id: categoryId,
      },
    });
  });
};

export { getCategories, createCategory, updateCategory, deleteCategory };
