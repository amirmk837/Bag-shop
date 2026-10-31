import prisma from "../config/prisma.js";
import { createCustomerOrderInTransaction } from "./order.service.js";
import { requestZarinpalPayment } from "./zarinpal.service.js";

const MAX_DATABASE_INT = 2147483647;
const MAX_ORDER_AMOUNT_TOMAN = Math.floor(MAX_DATABASE_INT / 10);
const MAX_TRANSACTION_ATTEMPTS = 3;

const createPaymentError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const validateUserId = (userId) => {
  const numericUserId = Number(userId);

  if (!Number.isSafeInteger(numericUserId) || numericUserId < 1) {
    throw createPaymentError(400, "شناسه کاربر معتبر نیست.");
  }

  return numericUserId;
};

const validateShippingMethodId = (shippingMethodId) => {
  if (
    shippingMethodId === undefined ||
    shippingMethodId === null ||
    (typeof shippingMethodId === "string" && shippingMethodId.trim() === "")
  ) {
    throw createPaymentError(400, "لطفاً روش ارسال را انتخاب کنید.");
  }

  const numericId = Number(shippingMethodId);

  if (!Number.isSafeInteger(numericId) || numericId < 1) {
    throw createPaymentError(400, "شناسه روش ارسال معتبر نیست.");
  }

  return numericId;
};

const validateRialAmount = (totalAmount) => {
  const amountRial = totalAmount * 10;

  if (
    !Number.isSafeInteger(totalAmount) ||
    totalAmount <= 0 ||
    totalAmount > MAX_ORDER_AMOUNT_TOMAN ||
    !Number.isSafeInteger(amountRial) ||
    amountRial <= 0 ||
    amountRial > MAX_DATABASE_INT
  ) {
    throw createPaymentError(400, "مبلغ سفارش برای پرداخت آنلاین معتبر نیست.");
  }

  return amountRial;
};

const getPaymentSettings = async () => {
  const settings = await prisma.paymentSettings.findUnique({
    where: { id: 1 },
  });

  const merchantId =
    typeof settings?.merchantId === "string" ? settings.merchantId.trim() : "";

  const isValidMerchantId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      merchantId,
    );

  if (settings?.provider !== "ZARINPAL" || !isValidMerchantId) {
    throw createPaymentError(
      503,
      "تنظیمات پذیرنده زرین‌پال معتبر یا کامل نیست.",
    );
  }

  if (settings.isEnabled !== true) {
    throw createPaymentError(503, "پرداخت آنلاین از پنل مدیریت فعال نشده است.");
  }

  let callbackUrl;

  try {
    if (!process.env.PAYMENT_CALLBACK_URL?.trim()) {
      throw new Error("Callback URL is missing.");
    }

    callbackUrl = new URL(process.env.PAYMENT_CALLBACK_URL);
  } catch {
    throw createPaymentError(503, "آدرس بازگشت پرداخت معتبر نیست.");
  }

  const isLocalhost =
    callbackUrl.hostname === "localhost" ||
    callbackUrl.hostname === "127.0.0.1";

  if (
    callbackUrl.protocol !== "https:" &&
    !(process.env.ZARINPAL_SANDBOX === "true" &&
      isLocalhost &&
      callbackUrl.protocol === "http:")
  ) {
    throw createPaymentError(503, "آدرس بازگشت پرداخت باید HTTPS باشد.");
  }

  if (callbackUrl.username || callbackUrl.password || callbackUrl.hash) {
    throw createPaymentError(503, "آدرس بازگشت پرداخت معتبر نیست.");
  }

  return {
    merchantId,
    callbackUrl: callbackUrl.toString(),
  };
};

// =========================================
// ATOMIC ORDER + PAYMENT CREATION
// =========================================

const createOrderAndPayment = async (userId, shippingMethodId, merchantId) => {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          // قفل ردیف کاربر برای جلوگیری از شروع هم‌زمان چند پرداخت
          const lockedUsers = await tx.$queryRaw`
            SELECT "id"
            FROM "User"
            WHERE "id" = ${userId}
            FOR UPDATE
          `;

          if (!lockedUsers || lockedUsers.length === 0) {
            throw createPaymentError(404, "کاربر پیدا نشد.");
          }

          // بررسی تراکنش‌های قبلی در همان تراکنش
          const pendingPayment = await tx.payment.findFirst({
            where: {
              provider: "ZARINPAL",
              status: {
                in: ["CREATED", "REQUESTING", "REQUESTED"],
              },
              order: {
                userId,
                status: "PENDING",
              },
            },
            select: {
              id: true,
              orderId: true,
              status: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

          if (pendingPayment) {
            throw createPaymentError(
              409,
              `سفارش شماره ${pendingPayment.orderId} هنوز تعیین تکلیف نشده است. ابتدا وضعیت پرداخت قبلی را بررسی کنید.`,
            );
          }

          // ساخت سفارش و رزرو موجودی در همین تراکنش
          const order = await createCustomerOrderInTransaction(
            tx,
            userId,
            shippingMethodId,
            MAX_ORDER_AMOUNT_TOMAN,
          );

          const amountRial = validateRialAmount(order.totalAmount);

          // ایجاد رکورد پرداخت قبل از خروج از تراکنش
          const payment = await tx.payment.create({
            data: {
              orderId: order.id,
              provider: "ZARINPAL",
              status: "CREATED",
              amountRial,
              merchantIdSnapshot: merchantId,
            },
            select: {
              id: true,
              orderId: true,
              amountRial: true,
            },
          });

          return {
            order,
            payment,
          };
        },
        {
          isolationLevel: "Serializable",
        },
      );
    } catch (error) {
      if (error?.code === "P2034" && attempt < MAX_TRANSACTION_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
        continue;
      }

      throw error;
    }
  }

  throw createPaymentError(409, "شروع پرداخت انجام نشد؛ دوباره تلاش کنید.");
};

// =========================================
// START CUSTOMER PAYMENT
// =========================================

export const startCustomerPayment = async (userId, shippingMethodId) => {
  const numericUserId = validateUserId(userId);
  const numericShippingMethodId = validateShippingMethodId(shippingMethodId);

  const { merchantId, callbackUrl } = await getPaymentSettings();

  // سفارش و پرداخت به‌صورت اتمیک ایجاد می‌شوند.
  const { order, payment } = await createOrderAndPayment(
    numericUserId,
    numericShippingMethodId,
    merchantId,
  );

  const requestStarted = await prisma.payment.updateMany({
    where: { id: payment.id, status: "CREATED" },
    data: { status: "REQUESTING" },
  });

  if (requestStarted.count !== 1) {
    console.error("PAYMENT_REQUEST_STATE_CONFLICT", { paymentId: payment.id, orderId: order.id });
    throw createPaymentError(409, "وضعیت درخواست پرداخت تغییر کرده است؛ بررسی دستی لازم است.");
  }

  try {
    const result = await requestZarinpalPayment({
      merchantId,
      amountRial: payment.amountRial,
      callbackUrl,
      description: `پرداخت سفارش شماره ${order.id}`,
      metadata: {
        mobile: order.shippingRecipientPhone,
      },
    });

    if (
      typeof result?.authority !== "string" ||
      !result.authority.trim() ||
      typeof result?.paymentUrl !== "string" ||
      !result.paymentUrl.trim()
    ) {
      throw new Error("پاسخ درگاه فاقد اطلاعات معتبر پرداخت است.");
    }

    const authority = result.authority.trim();

    const updatedPayment = await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: "REQUESTING",
        authority: null,
      },
      data: {
        authority,
        status: "REQUESTED",
      },
    });

    if (updatedPayment.count !== 1) {
      console.error("PAYMENT AUTHORITY SAVE NEEDS REVIEW:", {
        paymentId: payment.id,
        orderId: order.id,
      });

      throw new Error("ذخیره شناسه درگاه انجام نشد؛ بررسی دستی لازم است.");
    }

    return {
      orderId: order.id,
      paymentUrl: result.paymentUrl,
    };
  } catch (error) {
    console.error("ZARINPAL_REQUEST_REQUIRES_RECONCILIATION", {
      orderId: order.id,
      paymentId: payment.id,
      errorType: error?.name || "Error",
    });

    throw createPaymentError(
      503,
      "نتیجه شروع پرداخت مشخص نیست. سفارش و موجودی حفظ شده‌اند؛ پیش از تلاش مجدد وضعیت تراکنش را بررسی کنید.",
    );
  }
};
