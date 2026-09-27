import prisma from "../config/prisma.js";

const getCategories = async () => {
  return prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
};

const createCategory = async (data) => {
  return prisma.category.create({
    data,
  });
};

export { getCategories, createCategory };
