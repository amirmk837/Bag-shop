import prisma from "../config/prisma.js";

const SETTINGS_ID = 1;

const DEFAULTS = {
  id: SETTINGS_ID,
  storeName: "فروشگاه کاظمی",
  logoUrl: null,
  footerLogoUrl: null,
  phone: "",
  headerText: "",
  footerAbout: "",
  footerCaption: "© فروشگاه کاظمی — تمامی حقوق محفوظ است.",
  showPopularShowcase: true,
  showDiscountShowcase: true,
};

export const getSiteSettings = async () =>
  (await prisma.siteSettings.findUnique({
    where: { id: SETTINGS_ID },
  })) || DEFAULTS;

export const updateSiteSettings = async (data) =>
  prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { ...DEFAULTS, ...data },
    update: data,
  });
