import prisma from "../config/prisma.js";

const createProducts = async (products) => {
  const result = await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  return result;
};

const getProducts = async () => {
  return prisma.product.findMany({
    orderBy: {
      id: "asc",
    },
  });
};

export { createProducts, getProducts };
