import prisma from "../config/prisma.js";

const createError = (status, message) =>
  Object.assign(new Error(message), { status });

const parseId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const validateName = (value) => {
  if (typeof value !== "string") {
    throw createError(400, "نام روش ارسال الزامی است.");
  }

  const name = value.trim();

  if (!name || name.length > 100) {
    throw createError(400, "نام روش ارسال باید بین ۱ تا ۱۰۰ کاراکتر باشد.");
  }

  return name;
};

const validatePrice = (value) => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw createError(400, "هزینه ارسال باید عدد صحیح نامنفی به تومان باشد.");
  }

  return value;
};

const validateDescription = (value) => {
  if (value === undefined || value === null) return null;

  if (typeof value !== "string" || value.trim().length > 500) {
    throw createError(400, "توضیحات حداکثر ۵۰۰ کاراکتر باشد.");
  }

  return value.trim() || null;
};

export const getAdminShippingMethods = async () =>
  prisma.shippingMethod.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

export const createShippingMethod = async (body = {}) => {
  const name = validateName(body.name);
  const price = validatePrice(body.price);
  const description = validateDescription(body.description);

  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    throw createError(400, "وضعیت فعال بودن معتبر نیست.");
  }

  try {
    return await prisma.shippingMethod.create({
      data: {
        name,
        price,
        description,
        isActive: body.isActive ?? true,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw createError(409, "این نام روش ارسال قبلاً ثبت شده است.");
    }
    throw error;
  }
};

export const updateShippingMethod = async (methodId, body = {}) => {
  const id = parseId(methodId);
  if (!id) throw createError(400, "شناسه روش ارسال معتبر نیست.");

  const data = {};

  if (body.name !== undefined) data.name = validateName(body.name);
  if (body.price !== undefined) data.price = validatePrice(body.price);

  if (body.description !== undefined) {
    data.description = validateDescription(body.description);
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      throw createError(400, "وضعیت فعال بودن معتبر نیست.");
    }
    data.isActive = body.isActive;
  }

  if (Object.keys(data).length === 0) {
    throw createError(400, "حداقل یک فیلد برای ویرایش ارسال کنید.");
  }

  try {
    return await prisma.shippingMethod.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw createError(404, "روش ارسال پیدا نشد.");
    }
    if (error.code === "P2002") {
      throw createError(409, "این نام روش ارسال قبلاً ثبت شده است.");
    }
    throw error;
  }
};

export const deleteShippingMethod = async (methodId) => {
  const id = parseId(methodId);
  if (!id) throw createError(400, "شناسه روش ارسال معتبر نیست.");

  try {
    return await prisma.shippingMethod.delete({
      where: { id },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw createError(404, "روش ارسال پیدا نشد.");
    }
    if (error.code === "P2003") {
      throw createError(
        409,
        "این روش ارسال به سفارش مرتبط است؛ آن را غیرفعال کنید.",
      );
    }
    throw error;
  }
};
