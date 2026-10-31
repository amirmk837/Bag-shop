import prisma from "../config/prisma.js";
import { reserveStock } from "./stock.service.js";

// =========================================
// CONSTANTS & HELPERS
// =========================================

const MAX_DATABASE_INT = 2147483647;

const createOrderError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parsePositiveInt = (value) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
};

const validateAmount = (amount) =>
  Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_DATABASE_INT;

const orderSelect = {
  id: true,
  status: true,
  totalAmount: true,
  shippingCost: true,
  shippingMethod: true,
  trackingCode: true,
  shippedAt: true,
  deliveredAt: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      productId: true,
      productCode: true,
      title: true,
      color: true,
      unitPrice: true,
      quantity: true,
      subtotal: true,
    },
  },
};

// =========================================
// CREATE CUSTOMER ORDER
// =========================================

export const createCustomerOrder = async (userId, shippingMethodId) => {
  const numericUserId = parsePositiveInt(userId);
  const numericShippingMethodId = parsePositiveInt(shippingMethodId);

  if (!numericUserId || !numericShippingMethodId) {
    throw createOrderError(400, "اطلاعات سفارش معتبر نیست.");
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const address = await tx.userAddress.findUnique({
            where: { userId: numericUserId },
          });

          if (!address) {
            throw createOrderError(400, "ابتدا آدرس ارسال خود را ذخیره کنید.");
          }

          const shippingMethod = await tx.shippingMethod.findFirst({
            where: {
              id: numericShippingMethodId,
              isActive: true,
            },
          });

          if (!shippingMethod) {
            throw createOrderError(400, "روش ارسال معتبر یا فعال نیست.");
          }

          const cart = await tx.cart.findUnique({
            where: { userId: numericUserId },
            select: {
              id: true,
              items: {
                select: {
                  productId: true,
                  quantity: true,
                  color: true,
                  product: {
                    select: {
                      id: true,
                      productCode: true,
                      title: true,
                      price: true,
                    },
                  },
                },
              },
            },
          });

          if (!cart || cart.items.length === 0) {
            throw createOrderError(400, "سبد خرید شما خالی است.");
          }

          let productsTotal = 0;

          const items = cart.items.map((item) => {
            const product = item.product;

            if (
              !product ||
              !Number.isSafeInteger(item.quantity) ||
              item.quantity < 1 ||
              !Number.isSafeInteger(product.price) ||
              product.price < 1
            ) {
              throw createOrderError(
                400,
                "اطلاعات یکی از اقلام سفارش معتبر نیست.",
              );
            }

            const subtotal = product.price * item.quantity;
            productsTotal += subtotal;

            if (!validateAmount(subtotal) || !validateAmount(productsTotal)) {
              throw createOrderError(400, "مبلغ سفارش بیش از حد مجاز است.");
            }

            return {
              productId: product.id,
              productCode: product.productCode,
              title: product.title,
              color: item.color || "",
              unitPrice: product.price,
              quantity: item.quantity,
              subtotal,
            };
          });

          const shippingCost = shippingMethod.price;
          const totalAmount = productsTotal + shippingCost;

          if (
            !Number.isSafeInteger(shippingCost) ||
            shippingCost < 0 ||
            !validateAmount(totalAmount) ||
            totalAmount > Math.floor(MAX_DATABASE_INT / 10)
          ) {
            throw createOrderError(400, "مبلغ نهایی سفارش معتبر نیست.");
          }

          for (const item of items) {
            await reserveStock(tx, {
              productId: item.productId,
              color: item.color,
              quantity: item.quantity,
              title: item.title,
            });
          }

          const order = await tx.order.create({
            data: {
              userId: numericUserId,
              status: "PENDING",
              totalAmount,
              shippingCost,
              shippingMethod: shippingMethod.name,
              shippingMethodId: shippingMethod.id,
              shippingRecipientName: address.recipientName,
              shippingRecipientPhone: address.recipientPhone,
              shippingProvince: address.province,
              shippingCity: address.city,
              shippingAddressLine: address.addressLine,
              shippingPostalCode: address.postalCode,
              shippingPlateNumber: address.plateNumber,
              shippingUnitNumber: address.unitNumber,
              items: {
                create: items.map((item) => ({
                  product: { connect: { id: item.productId } },
                  productCode: item.productCode,
                  title: item.title,
                  color: item.color,
                  unitPrice: item.unitPrice,
                  quantity: item.quantity,
                  subtotal: item.subtotal,
                })),
              },
            },
            select: orderSelect,
          });

          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });

          return order;
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (error?.code === "P2034" && attempt < 2) {
        continue;
      }

      throw error;
    }
  }

  throw createOrderError(409, "ثبت سفارش انجام نشد؛ دوباره تلاش کنید.");
};

// =========================================
// GET CUSTOMER ORDERS
// =========================================

export const getCustomerOrders = async (userId) => {
  const numericUserId = parsePositiveInt(userId);

  if (!numericUserId) {
    throw createOrderError(400, "شناسه مشتری معتبر نیست.");
  }

  return prisma.order.findMany({
    where: { userId: numericUserId },
    select: {
      ...orderSelect,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          refId: true,
          verifiedAt: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
};

// =========================================
// LEGACY PAYMENT STATUS EXPORT
// =========================================

export const getCustomerOrderPaymentStatus = async (userId, orderId) => {
  const numericUserId = parsePositiveInt(userId);
  const numericOrderId = parsePositiveInt(orderId);

  if (!numericUserId) {
    throw createOrderError(401, "احراز هویت مشتری معتبر نیست.");
  }

  if (!numericOrderId) {
    throw createOrderError(400, "شماره سفارش معتبر نیست.");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: numericOrderId,
      userId: numericUserId,
    },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          refId: true,
          verifiedAt: true,
          amountRial: true,
        },
      },
    },
  });

  if (!order) {
    throw createOrderError(404, "سفارش پیدا نشد.");
  }

  const payment = order.payments[0] ?? null;

  return {
    orderId: order.id,
    orderStatus: order.status,
    totalAmount: order.totalAmount,
    paymentStatus: payment?.status ?? null,
    amountRial: payment?.amountRial ?? null,
    refId: payment?.refId ?? null,
    verifiedAt: payment?.verifiedAt ?? null,
  };
};

// =========================================
// LEGACY SHIPPING TEST ENDPOINT
// =========================================

export const createShippingTestOrder = async () => {
  if (process.env.NODE_ENV !== "development") {
    throw createOrderError(404, "این قابلیت فقط در محیط توسعه فعال است.");
  }

  throw createOrderError(
    400,
    "برای تست ارسال، از مسیر سفارش آزمایشی محصول‌دار استفاده کنید.",
  );
};

// =========================================
// PRODUCT SHIPPING TEST ORDER
// =========================================

export const createProductShippingTestOrder = async (
  userId,
  shippingMethodId,
) => {
  if (process.env.NODE_ENV !== "development") {
    throw createOrderError(404, "این قابلیت فقط در محیط توسعه فعال است.");
  }

  const numericUserId = parsePositiveInt(userId);
  const numericShippingMethodId = parsePositiveInt(shippingMethodId);

  if (!numericUserId || !numericShippingMethodId) {
    throw createOrderError(400, "اطلاعات سفارش آزمایشی معتبر نیست.");
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const address = await tx.userAddress.findUnique({
            where: { userId: numericUserId },
          });

          if (!address) {
            throw createOrderError(400, "ابتدا آدرس ارسال خود را ذخیره کنید.");
          }

          const shippingMethod = await tx.shippingMethod.findFirst({
            where: {
              id: numericShippingMethodId,
              isActive: true,
            },
          });

          if (!shippingMethod) {
            throw createOrderError(400, "روش ارسال معتبر یا فعال نیست.");
          }

          const cart = await tx.cart.findUnique({
            where: { userId: numericUserId },
            select: {
              id: true,
              items: {
                select: {
                  productId: true,
                  quantity: true,
                  color: true,
                  product: {
                    select: {
                      id: true,
                      productCode: true,
                      title: true,
                      price: true,
                    },
                  },
                },
              },
            },
          });

          if (!cart || cart.items.length === 0) {
            throw createOrderError(400, "سبد خرید شما خالی است.");
          }

          let productsTotal = 0;

          const items = cart.items.map((item) => {
            const product = item.product;

            if (
              !product ||
              !Number.isSafeInteger(item.quantity) ||
              item.quantity < 1 ||
              !Number.isSafeInteger(product.price) ||
              product.price < 1
            ) {
              throw createOrderError(
                400,
                "اطلاعات یکی از اقلام سفارش معتبر نیست.",
              );
            }

            const subtotal = product.price * item.quantity;
            productsTotal += subtotal;

            if (!validateAmount(subtotal) || !validateAmount(productsTotal)) {
              throw createOrderError(400, "مبلغ سفارش بیش از حد مجاز است.");
            }

            return {
              productId: product.id,
              productCode: product.productCode,
              title: product.title,
              color: item.color || "",
              unitPrice: product.price,
              quantity: item.quantity,
              subtotal,
            };
          });

          const shippingCost = shippingMethod.price;
          const totalAmount = productsTotal + shippingCost;

          if (
            !Number.isSafeInteger(shippingCost) ||
            shippingCost < 0 ||
            !validateAmount(totalAmount) ||
            totalAmount > Math.floor(MAX_DATABASE_INT / 10)
          ) {
            throw createOrderError(400, "مبلغ نهایی سفارش معتبر نیست.");
          }

          for (const item of items) {
            await reserveStock(tx, {
              productId: item.productId,
              color: item.color,
              quantity: item.quantity,
              title: item.title,
            });
          }

          const order = await tx.order.create({
            data: {
              userId: numericUserId,
              status: "PROCESSING",
              totalAmount,
              shippingCost,
              shippingMethod: shippingMethod.name,
              shippingMethodId: shippingMethod.id,
              shippingRecipientName: address.recipientName,
              shippingRecipientPhone: address.recipientPhone,
              shippingProvince: address.province,
              shippingCity: address.city,
              shippingAddressLine: address.addressLine,
              shippingPostalCode: address.postalCode,
              shippingPlateNumber: address.plateNumber,
              shippingUnitNumber: address.unitNumber,
              items: {
                create: items.map((item) => ({
                  product: { connect: { id: item.productId } },
                  productCode: item.productCode,
                  title: item.title,
                  color: item.color,
                  unitPrice: item.unitPrice,
                  quantity: item.quantity,
                  subtotal: item.subtotal,
                })),
              },
            },
            select: orderSelect,
          });

          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });

          return order;
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (error?.code === "P2034" && attempt < 2) {
        continue;
      }

      throw error;
    }
  }

  throw createOrderError(
    409,
    "ساخت سفارش آزمایشی انجام نشد؛ دوباره تلاش کنید.",
  );
};
