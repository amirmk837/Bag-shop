import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const categories = [
  {
    name: "CAT",
    slug: "cat",
    image: "/images/categories/cat.webp",
  },
  {
    name: "Targus",
    slug: "targus",
    image: "/images/categories/targus.webp",
  },
  {
    name: "Forward",
    slug: "forward",
    image: "/images/categories/forward.webp",
  },
  {
    name: "Alexa",
    slug: "alexa",
    image: "/images/categories/alexa.webp",
  },
  {
    name: "Lexin",
    slug: "lexin",
    image: "/images/categories/lexin.webp",
  },
  {
    name: "Glossy",
    slug: "glossy",
    image: "/images/categories/glossy.webp",
  },
];

const seedCategories = async () => {
  try {
    for (const category of categories) {
      await prisma.category.upsert({
        where: {
          slug: category.slug,
        },
        update: category,
        create: category,
      });

      console.log(`✓ ${category.name}`);
    }

    console.log("Categories seeded successfully.");
  } catch (error) {
    console.error("Category seed error:", error);
  } finally {
    await prisma.$disconnect();
  }
};

seedCategories();
