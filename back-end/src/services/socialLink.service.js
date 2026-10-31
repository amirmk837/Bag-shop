import prisma from "../config/prisma.js";

export const SOCIAL_PLATFORMS = [
  { platform: "INSTAGRAM", label: "اینستاگرام" },
  { platform: "TELEGRAM", label: "تلگرام" },
  { platform: "WHATSAPP", label: "واتساپ" },
  { platform: "BALE", label: "بله" },
  { platform: "RUBIKA", label: "روبیکا" },
];

const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const normalizeSocialUrl = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw createError(400, "لینک باید متن باشد.");
  }

  const input = value.trim();

  if (!input) return null;

  if (input.length > 2048 || /[\u0000-\u001F\\]/.test(input)) {
    throw createError(400, "لینک نامعتبر است.");
  }

  const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  try {
    const url = new URL(normalized);

    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      !url.hostname.includes(".") ||
      url.username ||
      url.password
    ) {
      throw new Error("Invalid URL");
    }

    return url.toString();
  } catch {
    throw createError(400, "لینک معتبر HTTPS وارد کن.");
  }
};

// PUBLIC: فقط شبکه‌هایی که لینک دارند
export const getPublicSocialLinks = async () => {
  return prisma.socialLink.findMany({
    where: {
      url: { not: null },
    },
    select: {
      platform: true,
      url: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

// ADMIN: نمایش همه گزینه‌ها، حتی تنظیم‌نشده‌ها
export const getAdminSocialLinks = async () => {
  const savedLinks = await prisma.socialLink.findMany();

  return SOCIAL_PLATFORMS.map(({ platform, label }) => {
    const saved = savedLinks.find((item) => item.platform === platform);

    return {
      platform,
      label,
      url: saved?.url ?? "",
    };
  });
};

// ADMIN: ذخیره یا پاک‌کردن لینک یک شبکه
export const saveSocialLink = async (platformValue, urlValue) => {
  const platform = String(platformValue || "").toUpperCase();

  if (!SOCIAL_PLATFORMS.some((item) => item.platform === platform)) {
    throw createError(400, "شبکه اجتماعی نامعتبر است.");
  }

  const url = normalizeSocialUrl(urlValue);

  return prisma.socialLink.upsert({
    where: { platform },
    create: { platform, url },
    update: { url },
    select: {
      platform: true,
      url: true,
    },
  });
};
