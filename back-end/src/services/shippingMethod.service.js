import prisma from "../config/prisma.js";

export const getActiveShippingMethods = async () => {
  return prisma.shippingMethod.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
    },
    orderBy: {
      price: "asc",
    },
  });
};
