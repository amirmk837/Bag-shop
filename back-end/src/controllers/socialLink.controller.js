import {
  createSocialLink,
  deleteSocialLink,
  getAdminSocialLinks,
  getPublicSocialLinks,
  saveSocialLink,
} from "../services/socialLink.service.js";

const sendError = (res, error, fallback) => {
  console.error(fallback, error);
  return res.status(error.status || 500).json({
    message: error.status ? error.message : fallback,
  });
};

export const getPublicSocialLinksController = async (_req, res) => {
  try {
    return res.status(200).json({ data: await getPublicSocialLinks() });
  } catch (error) {
    return sendError(res, error, "دریافت لینک‌های شبکه‌های اجتماعی ناموفق بود.");
  }
};

export const getAdminSocialLinksController = async (_req, res) => {
  try {
    return res.status(200).json({ data: await getAdminSocialLinks() });
  } catch (error) {
    return sendError(res, error, "دریافت تنظیمات شبکه‌های اجتماعی ناموفق بود.");
  }
};

export const createSocialLinkController = async (req, res) => {
  try {
    return res.status(201).json({
      message: "پلتفرم شبکه اجتماعی اضافه شد.",
      data: await createSocialLink(req.body),
    });
  } catch (error) {
    return sendError(res, error, "افزودن پلتفرم ناموفق بود.");
  }
};

export const saveSocialLinkController = async (req, res) => {
  try {
    return res.status(200).json({
      message: "تنظیمات شبکه اجتماعی ذخیره شد.",
      data: await saveSocialLink(req.params.platform, req.body),
    });
  } catch (error) {
    return sendError(res, error, "ذخیره لینک شبکه اجتماعی ناموفق بود.");
  }
};

export const deleteSocialLinkController = async (req, res) => {
  try {
    return res.status(200).json({
      message: "پلتفرم شبکه اجتماعی حذف شد.",
      data: await deleteSocialLink(req.params.platform),
    });
  } catch (error) {
    return sendError(res, error, "حذف پلتفرم ناموفق بود.");
  }
};
