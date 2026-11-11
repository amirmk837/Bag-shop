import prisma from "../config/prisma.js";

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parseId = (value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError(400, "شناسه پرسش متداول نامعتبر است.");
  }
  return id;
};

export const getPublicFaqItems = () => prisma.faqItem.findMany({
  where: { isActive: true },
  select: {
    id: true,
    question: true,
    answer: true,
    linkText: true,
    linkUrl: true,
  },
  orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
});

export const getAdminFaqItems = () => prisma.faqItem.findMany({
  orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
});

export const createFaqItem = (data) => prisma.faqItem.create({ data });

export const updateFaqItem = async (value, data) => {
  const id = parseId(value);
  const existing = await prisma.faqItem.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw createError(404, "پرسش متداول پیدا نشد.");
  return prisma.faqItem.update({ where: { id }, data });
};

export const deleteFaqItem = async (value) => {
  const id = parseId(value);
  const existing = await prisma.faqItem.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw createError(404, "پرسش متداول پیدا نشد.");
  await prisma.faqItem.delete({ where: { id } });
  return { id };
};
