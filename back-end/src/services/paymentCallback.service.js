import prisma from "../config/prisma.js";
import { verifyZarinpalPayment } from "./zarinpal.service.js";

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const MAX_ATTEMPTS = 3;

const runSerializableTransaction = async (callback) => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(callback, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (error?.code !== "P2034" || attempt === MAX_ATTEMPTS) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
    }
  }

  throw fail(503, "تراکنش پرداخت تکمیل نشد؛ وضعیت سفارش را بررسی کنید.");
};

export const handleZarinpalCallback = async ({ authority }) => {
  if (typeof authority !== "string" || !authority.trim()) {
    throw fail(400, "شناسه پرداخت معتبر نیست.");
  }

  const normalizedAuthority = authority.trim();

  const payment = await prisma.payment.findUnique({
    where: { authority: normalizedAuthority },
    select: {
      id: true,
      orderId: true,
      status: true,
      amountRial: true,
      refId: true,
      merchantIdSnapshot: true,
      order: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!payment) {
    throw fail(404, "تراکنش پرداخت پیدا نشد.");
  }

  if (payment.status === "PAID") {
    return {
      status: "success",
      orderId: payment.orderId,
      referenceId: payment.refId,
    };
  }

  if (payment.status !== "REQUESTED") {
    throw fail(409, "وضعیت تراکنش برای تأیید معتبر نیست؛ بررسی دستی لازم است.");
  }

  if (payment.order.status !== "PENDING") {
    throw fail(
      409,
      "وضعیت سفارش با تراکنش پرداخت سازگار نیست؛ بررسی دستی لازم است.",
    );
  }

  const merchantId = payment.merchantIdSnapshot;

  if (typeof merchantId !== "string" || !merchantId.trim()) {
    console.error("PAYMENT MERCHANT SNAPSHOT MISSING:", {
      paymentId: payment.id,
      orderId: payment.orderId,
    });

    throw fail(
      503,
      "شناسه پذیرنده این تراکنش موجود نیست؛ بررسی دستی لازم است.",
    );
  }

  let verification;

  try {
    verification = await verifyZarinpalPayment({
      merchantId: merchantId.trim(),
      amountRial: payment.amountRial,
      authority: normalizedAuthority,
    });
  } catch (error) {
    console.error("ZARINPAL VERIFY ERROR:", {
      paymentId: payment.id,
      orderId: payment.orderId,
      message: error?.message,
    });

    throw fail(503, "نتیجه تأیید پرداخت مشخص نیست؛ سفارش لغو نشده است.");
  }

  const verificationCode = Number(verification?.code);
  const referenceId =
    verification?.refId != null ? String(verification.refId).trim() : "";

  if (![100, 101].includes(verificationCode) || !referenceId) {
    console.error("ZARINPAL PAYMENT NEEDS REVIEW:", {
      paymentId: payment.id,
      orderId: payment.orderId,
      verificationCode,
      hasReferenceId: Boolean(referenceId),
    });

    throw fail(
      409,
      "پرداخت تأیید قطعی نشده است؛ سفارش لغو نشده و بررسی وضعیت آن لازم است.",
    );
  }

  return runSerializableTransaction(async (tx) => {
    const currentPayment = await tx.payment.findUnique({
      where: { id: payment.id },
      include: {
        order: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!currentPayment) {
      throw fail(404, "تراکنش پرداخت پیدا نشد.");
    }

    if (currentPayment.status === "PAID") {
      return {
        status: "success",
        orderId: currentPayment.orderId,
        referenceId: currentPayment.refId,
      };
    }

    if (
      currentPayment.status !== "REQUESTED" ||
      currentPayment.order.status !== "PENDING"
    ) {
      throw fail(
        409,
        "درگاه پرداخت را تأیید کرده، اما وضعیت داخلی تغییر کرده است؛ بررسی دستی لازم است.",
      );
    }

    const orderUpdate = await tx.order.updateMany({
      where: {
        id: currentPayment.orderId,
        status: "PENDING",
      },
      data: {
        status: "PAID",
      },
    });

    if (orderUpdate.count !== 1) {
      throw fail(
        409,
        "پرداخت در درگاه تأیید شده، اما سفارش به‌روزرسانی نشد؛ بررسی دستی لازم است.",
      );
    }

    await tx.payment.update({
      where: { id: currentPayment.id },
      data: {
        status: "PAID",
        refId: referenceId,
        verifiedAt: new Date(),
      },
    });

    return {
      status: "success",
      orderId: currentPayment.orderId,
      referenceId,
    };
  });
};
