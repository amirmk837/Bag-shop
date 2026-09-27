import prisma from "../config/prisma.js";

// =========================================
// GET ALL
// =========================================

const getProducts = async () => {
  return prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

// =========================================
// GET ONE
// =========================================

const getProductByCode = async (productCode) => {
  return prisma.product.findUnique({
    where: {
      productCode,
    },
    include: {
      category: true,
    },
  });
};

// =========================================
// CREATE
// =========================================

const createProduct = async (data) => {
  const category = await prisma.category.findUnique({
    where: {
      id: Number(data.categoryId),
    },
  });

  if (!category) {
    const error = new Error("دسته‌بندی پیدا نشد");
    error.code = "CATEGORY_NOT_FOUND";

    throw error;
  }

  return prisma.product.create({
    data: {
      productCode: data.productCode,
      title: data.title,

      // فعلاً برای سازگاری با Frontend قدیمی
      // Category همان Brand پروژه است.
      brand: category.name,

      categoryId: category.id,

      count: data.count,
      color: data.color,
      price: data.price,
      description: data.description,
      images: data.images,
    },

    include: {
      category: true,
    },
  });
};

// =========================================
// UPDATE
// =========================================

const updateProduct = async (productCode, data) => {
  const category = await prisma.category.findUnique({
    where: {
      id: data.categoryId,
    },
  });

  if (!category) {
    const error = new Error("دسته‌بندی پیدا نشد");

    error.code = "CATEGORY_NOT_FOUND";

    throw error;
  }

  return prisma.product.update({
    where: {
      productCode,
    },

    data: {
      ...data,

      // موقتاً برای سازگاری Frontend قدیمی
      brand: category.name,
    },

    include: {
      category: true,
    },
  });
};

// =========================================
// DELETE
// =========================================

const deleteProduct = async (productCode) => {
  return prisma.product.delete({
    where: {
      productCode,
    },
  });
};

export {
  getProducts,
  getProductByCode,
  createProduct,
  updateProduct,
  deleteProduct,
};
