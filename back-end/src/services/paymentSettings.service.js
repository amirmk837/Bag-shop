import prisma from "../config/prisma.js";

const SETTINGS_ID = 1;

const isValidMerchantId = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const normalizeMerchantId = (merchantId) => {
  if (typeof merchantId !== "string") {
    const error = new Error("شناسه پذیرنده الزامی است.");
    error.status = 400;
    throw error;
  }

  const normalized = merchantId.trim();

  if (!isValidMerchantId(normalized)) {
    const error = new Error(
      "شناسه پذیرنده الزامی است و باید در قالب UUID وارد شود.",
    );
    error.status = 400;
    throw error;
  }

  return normalized;
};

export const getPaymentSettings = async () => {
  return prisma.paymentSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
};

export const updatePaymentSettings = async (merchantId) => {
  const normalizedMerchantId = normalizeMerchantId(merchantId);

  return prisma.paymentSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      provider: "ZARINPAL",
      merchantId: normalizedMerchantId,
      isEnabled: false,
    },
    update: {
      provider: "ZARINPAL",
      merchantId: normalizedMerchantId,
      isEnabled: false,
    },
  });
};
