import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const glossyProductCodes = [
  "pro-Sport",
  "swim-vest",
  "intest",
  "PS-01",
  "Conquest",
  "S5200",
];

const assignProductCategories = async () => {
  try {
    const categories = await prisma.category.findMany();

    const categoryMap = new Map(
      categories.map((category) => [category.slug, category.id]),
    );

    const requiredCategories = [
      "cat",
      "targus",
      "forward",
      "alexa",
      "lexin",
      "glossy",
    ];

    for (const slug of requiredCategories) {
      if (!categoryMap.has(slug)) {
        throw new Error(`Category "${slug}" پیدا نشد.`);
      }
    }

    // =========================================
    // CAT
    // =========================================

    await prisma.product.updateMany({
      where: {
        brand: {
          equals: "cat",
          mode: "insensitive",
        },
      },
      data: {
        categoryId: categoryMap.get("cat"),
      },
    });

    // =========================================
    // Targus
    // =========================================

    await prisma.product.updateMany({
      where: {
        brand: {
          equals: "targus",
          mode: "insensitive",
        },
      },
      data: {
        categoryId: categoryMap.get("targus"),
      },
    });

    // =========================================
    // Forward
    // =========================================

    await prisma.product.updateMany({
      where: {
        brand: {
          equals: "Forward",
          mode: "insensitive",
        },
      },
      data: {
        categoryId: categoryMap.get("forward"),
      },
    });

    // =========================================
    // Alexa
    // =========================================

    await prisma.product.updateMany({
      where: {
        brand: {
          equals: "Alexa",
          mode: "insensitive",
        },
      },
      data: {
        categoryId: categoryMap.get("alexa"),
      },
    });

    // =========================================
    // Lexin
    // =========================================

    await prisma.product.updateMany({
      where: {
        brand: {
          equals: "Lexin",
          mode: "insensitive",
        },
      },
      data: {
        categoryId: categoryMap.get("lexin"),
      },
    });

    // =========================================
    // Glossy
    // =========================================

    await prisma.product.updateMany({
      where: {
        productCode: {
          in: glossyProductCodes,
        },
      },
      data: {
        categoryId: categoryMap.get("glossy"),
      },
    });

    // =========================================
    // بررسی نهایی
    // =========================================

    const products = await prisma.product.findMany({
      select: {
        productCode: true,
        brand: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    console.table(products);

    const withoutCategory = products.filter((product) => !product.categoryId);

    if (withoutCategory.length > 0) {
      throw new Error(`${withoutCategory.length} محصول هنوز Category ندارند.`);
    }

    console.log("All products assigned to categories successfully.");
  } catch (error) {
    console.error("Assign category error:", error);
  } finally {
    await prisma.$disconnect();
  }
};

assignProductCategories();
