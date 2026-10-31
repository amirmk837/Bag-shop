import prisma from "../config/prisma.js";
import { createCustomerOrder } from "./order.service.js";
import { requestZarinpalPayment } from "./zarinpal.service.js";

const MAX_DATABASE_INT = 2_147_483_647;

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

const findPendingPayment = async (userId) => {
  return prisma.payment.findFirst({
    where: {
      provider: "ZARINPAL",
      status: { in: ["CREATED", "REQUESTED"] },
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
    orderBy: { createdAt: "desc" },
  });
};

export const startCustomerPayment = async (userId, shippingMethodId) => {
  const numericUserId = validateUserId(userId);
  const numericShippingMethodId = validateShippingMethodId(shippingMethodId);

  const { merchantId, callbackUrl } = await getPaymentSettings();

  const pendingPayment = await findPendingPayment(numericUserId);

  if (pendingPayment) {
    throw createPaymentError(
      409,
      `سفارش شماره ${pendingPayment.orderId} هنوز تعیین تکلیف نشده است. ابتدا وضعیت پرداخت قبلی را بررسی کنید.`,
    );
  }

  const order = await createCustomerOrder(
    numericUserId,
    numericShippingMethodId,
  );

  const amountRial = validateRialAmount(order.totalAmount);

  let payment;

  try {
    payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "ZARINPAL",
        status: "CREATED",
        amountRial,
        merchantIdSnapshot: merchantId,
      },
    });
  } catch (error) {
    console.error("CREATE PAYMENT RECORD ERROR:", {
      orderId: order.id,
      message: error?.message,
    });

    throw createPaymentError(
      503,
      "ثبت تراکنش پرداخت ناموفق بود؛ سفارش برای بررسی باقی مانده است.",
    );
  }

  try {
    const result = await requestZarinpalPayment({
      merchantId,
      amountRial,
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
        status: "CREATED",
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
    console.error("ZARINPAL REQUEST OR SAVE ERROR:", {
      orderId: order.id,
      paymentId: payment.id,
      message: error?.message,
    });

    throw createPaymentError(
      503,
      "نتیجه شروع پرداخت مشخص نیست. سفارش و موجودی حفظ شده‌اند؛ پیش از تلاش مجدد وضعیت تراکنش را بررسی کنید.",
    );
  }
};
