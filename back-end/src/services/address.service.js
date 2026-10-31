import prisma from "../config/prisma.js";

// =========================================
// GET ADDRESS
// =========================================

export const getUserAddress = async (userId) => {
  return prisma.userAddress.findUnique({
    where: {
      userId: Number(userId),
    },
  });
};

// =========================================
// CREATE / UPDATE ADDRESS
// =========================================

export const saveUserAddress = async (userId, data) => {
  return prisma.userAddress.upsert({
    where: {
      userId: Number(userId),
    },

    create: {
      userId: Number(userId),
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      province: data.province,
      city: data.city,
      addressLine: data.addressLine,
      postalCode: data.postalCode,
      plateNumber: data.plateNumber || null,
      unitNumber: data.unitNumber || null,
    },

    update: {
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      province: data.province,
      city: data.city,
      addressLine: data.addressLine,
      postalCode: data.postalCode,
      plateNumber: data.plateNumber || null,
      unitNumber: data.unitNumber || null,
    },
  });
};
