import prisma from "../config/prisma.js";

export const getCustomerPaymentStatus = async ({ userId, orderId }) => {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    const error = new Error("کاربر معتبر نیست.");
    error.status = 401;
    throw error;
  }

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    const error = new Error("شماره سفارش معتبر نیست.");
    error.status = 400;
    throw error;
  }

  // فقط سفارش متعلق به همین کاربر قابل مشاهده است.
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
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
    const error = new Error("سفارش پیدا نشد.");
    error.status = 404;
    throw error;
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
