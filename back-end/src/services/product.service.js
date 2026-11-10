import prisma from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.ts";

const productInclude = {
  category: true,
  colorStocks: {
    orderBy: { id: "asc" },
    select: { id: true, color: true, count: true },
  },
};

const createProductError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const normalizeColorStocks = (colorStocks) => {
  const result = new Map();

  for (const item of Array.isArray(colorStocks) ? colorStocks : []) {
    const color = String(item?.color ?? "").trim();

    if (!color) continue;

    if (result.has(color)) {
      throw createProductError("DUPLICATE_COLOR", `رنگ «${color}» تکراری است.`);
    }

    result.set(color, Number(item.count));
  }

  return [...result].map(([color, count]) => ({ color, count }));
};

const sumStocks = (stocks) =>
  stocks.reduce((total, item) => total + item.count, 0);

const joinColors = (stocks) => stocks.map((item) => item.color).join("، ");

// =========================================
// GET ALL
// =========================================

const getProducts = async (filters = {}) => {
  const conditions = [];

  if (filters.categorySlug) {
    const selectedCategory = await prisma.category.findUnique({
      where: { slug: filters.categorySlug },
      select: { id: true, children: { select: { id: true } } },
    });
    const ids = selectedCategory ? [selectedCategory.id, ...selectedCategory.children.map((item) => item.id)] : [-1];
    conditions.push({ categoryId: { in: ids } });
  }

  if (filters.discountedOnly) {
    conditions.push({ discountedPrice: { not: null } });
  }

  if (filters.search) {
    conditions.push({
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { productCode: { contains: filters.search, mode: "insensitive" } },
        { brand: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }

  const where = conditions.length ? { AND: conditions } : undefined;
  const query = {
    where,
    include: productInclude,
    orderBy: { id: "asc" },
  };

  // درخواست‌های قدیمی همچنان همه محصولات را بدون صفحه‌بندی دریافت می‌کنند.
  if (filters.page === undefined && filters.limit === undefined) {
    return prisma.product.findMany(query);
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;

  const totalPromise = prisma.product.count({ where });

  let itemsPromise;
  if (
    filters.discountedOnly &&
    (filters.sortBy === "discountPercent" || filters.sortBy === "discountedPrice")
  ) {
    const sqlConditions = [Prisma.sql`p."discountedPrice" IS NOT NULL`];

    if (filters.categorySlug) {
      sqlConditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "Category" c
        WHERE c."id" = p."categoryId"
          AND (c."slug" = ${filters.categorySlug}
            OR c."parentId" = (SELECT parent."id" FROM "Category" parent WHERE parent."slug" = ${filters.categorySlug}))
      )`);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      sqlConditions.push(Prisma.sql`(
        p."title" ILIKE ${searchTerm}
        OR p."productCode" ILIKE ${searchTerm}
        OR p."brand" ILIKE ${searchTerm}
      )`);
    }

    const sortExpression =
      filters.sortBy === "discountPercent"
        ? Prisma.sql`(p."price" - p."discountedPrice")::numeric / p."price"`
        : Prisma.sql`p."discountedPrice"`;
    const direction =
      filters.sortOrder === "asc" ? Prisma.raw("ASC") : Prisma.raw("DESC");

    itemsPromise = prisma.$queryRaw(Prisma.sql`
      SELECT p."id"
      FROM "Product" p
      WHERE ${Prisma.join(sqlConditions, " AND ")}
      ORDER BY ${sortExpression} ${direction}, p."id" ASC
      LIMIT ${limit}
      OFFSET ${(page - 1) * limit}
    `).then(async (rows) => {
      const ids = rows.map((row) => row.id);
      if (ids.length === 0) return [];
      const fetched = await prisma.product.findMany({
        where: { id: { in: ids } },
        include: productInclude,
      });
      const byId = new Map(fetched.map((product) => [product.id, product]));
      return ids.map((id) => byId.get(id)).filter(Boolean);
    });
  } else {
    itemsPromise = prisma.product.findMany({
      ...query,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  const [items, total] = await Promise.all([itemsPromise, totalPromise]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
};

// =========================================
// GET ONE
// =========================================

const getProductByCode = async (productCode) => {
  return prisma.product.findUnique({
    where: {
      productCode,
    },
    include: productInclude,
  });
};

// =========================================
// CREATE
// =========================================

const createProduct = async (data) => {
  const category = await prisma.category.findUnique({where:{id:Number(data.categoryId)},select:{id:true,name:true,_count:{select:{children:true}}}});
  if (!category) throw createProductError("CATEGORY_NOT_FOUND","دسته‌بندی پیدا نشد");
  if (category._count.children>0) throw createProductError("CATEGORY_IS_PARENT","محصول باید به یک زیر‌دسته‌بندی متصل شود.");

  const stocks = normalizeColorStocks(data.colorStocks);
  const hasColors = stocks.length > 0;

  return prisma.product.create({
    data: {
      productCode: data.productCode,
      title: data.title,

      // فعلاً برای سازگاری با Frontend قدیمی
      // Category همان Brand پروژه است.
      brand: category.name,

      categoryId: category.id,

      // با رنگ‌بندی، موجودی کل مجموع موجودی رنگ‌هاست.
      count: hasColors ? sumStocks(stocks) : data.count,
      color: hasColors ? joinColors(stocks) : null,
      price: data.price,
      discountedPrice: data.discountedPrice ?? null,
      description: data.description,
      images: data.images,

      colorStocks: hasColors ? { create: stocks } : undefined,
    },

    include: productInclude,
  });
};

// =========================================
// UPDATE
// =========================================

const updateProduct = async (productCode, data) => {
  const category = await prisma.category.findUnique({where:{id:data.categoryId},select:{id:true,name:true,_count:{select:{children:true}}}});
  if (!category) throw createProductError("CATEGORY_NOT_FOUND","دسته‌بندی پیدا نشد");
  if (category._count.children>0) throw createProductError("CATEGORY_IS_PARENT","محصول باید به یک زیر‌دسته‌بندی متصل شود.");

  const { colorStocks, color, count, ...fields } = data;

  const stocks =
    colorStocks === undefined ? null : normalizeColorStocks(colorStocks);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({
      where: { productCode },
      select: { id: true },
    });

    if (!existing) {
      throw createProductError("P2025", "محصول پیدا نشد");
    }

    const updateData = {
      ...fields,

      // موقتاً برای سازگاری Frontend قدیمی
      brand: category.name,
    };

    if (stocks === null) {
      if (count !== undefined) updateData.count = count;
      if (color !== undefined) updateData.color = color;
    } else if (stocks.length > 0) {
      const colors = stocks.map((item) => item.color);

      // رنگ‌های حذف‌شده: موجودی و ردیف‌های سبد آن‌ها پاک می‌شود.
      await tx.productColorStock.deleteMany({
        where: {
          productId: existing.id,
          color: { notIn: colors },
        },
      });

      await tx.cartItem.deleteMany({
        where: {
          productId: existing.id,
          color: { notIn: colors },
        },
      });

      for (const item of stocks) {
        await tx.productColorStock.upsert({
          where: {
            productId_color: {
              productId: existing.id,
              color: item.color,
            },
          },
          update: { count: item.count },
          create: {
            productId: existing.id,
            color: item.color,
            count: item.count,
          },
        });
      }

      updateData.count = sumStocks(stocks);
      updateData.color = joinColors(stocks);
    } else {
      // محصول بدون رنگ‌بندی
      await tx.productColorStock.deleteMany({
        where: { productId: existing.id },
      });

      await tx.cartItem.deleteMany({
        where: {
          productId: existing.id,
          NOT: { color: "" },
        },
      });

      if (count !== undefined) updateData.count = count;
      updateData.color = null;
    }

    return tx.product.update({
      where: { productCode },
      data: updateData,
      include: productInclude,
    });
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
