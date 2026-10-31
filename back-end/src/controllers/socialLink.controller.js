import {
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
    const data = await getPublicSocialLinks();
    return res.status(200).json({ data });
  } catch (error) {
    return sendError(
      res,
      error,
      "دریافت لینک‌های شبکه‌های اجتماعی ناموفق بود.",
    );
  }
};

export const getAdminSocialLinksController = async (_req, res) => {
  try {
    const data = await getAdminSocialLinks();
    return res.status(200).json({ data });
  } catch (error) {
    return sendError(res, error, "دریافت تنظیمات شبکه‌های اجتماعی ناموفق بود.");
  }
};

export const saveSocialLinkController = async (req, res) => {
  try {
    const data = await saveSocialLink(req.params.platform, req.body?.url);

    return res.status(200).json({
      message: "تنظیمات شبکه اجتماعی ذخیره شد.",
      data,
    });
  } catch (error) {
    return sendError(res, error, "ذخیره لینک شبکه اجتماعی ناموفق بود.");
  }
};
