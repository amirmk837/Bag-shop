import { unlink } from "node:fs/promises";
import path from "node:path";
import { getSiteSettings, updateSiteSettings } from "../services/siteSettings.service.js";
import { footerCaptionSchema } from "../validators/footerCaption.validator.js";

const cleanText = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : undefined;

export const getSiteSettingsController = async (_req, res) => {
  try {
    return res.json({ data: await getSiteSettings() });
  } catch (error) {
    console.error("Get site settings error:", error);
    return res.status(500).json({ message: "دریافت تنظیمات سایت ناموفق بود." });
  }
};

export const updateSiteSettingsController = async (req, res) => {
  const files = Object.values(req.files || {}).flat();
  try {
    const captionValidation = footerCaptionSchema.safeParse({
      footerCaption: req.body.footerCaption,
    });

    if (!captionValidation.success) {
      await Promise.all(files.map((file) => unlink(file.path).catch(() => {})));
      return res.status(400).json({
        message: captionValidation.error.issues[0]?.message || "متن کپی‌رایت نامعتبر است.",
      });
    }

    const current = await getSiteSettings();
    const data = {
      storeName: cleanText(req.body.storeName, 80) || current.storeName,
      phone: cleanText(req.body.phone, 30) ?? current.phone,
      headerText: cleanText(req.body.headerText, 180) ?? current.headerText,
      footerAbout: cleanText(req.body.footerAbout, 1000) ?? current.footerAbout,
      footerCaption: captionValidation.data.footerCaption ?? current.footerCaption,
      showPopularShowcase: req.body.showPopularShowcase === undefined
        ? current.showPopularShowcase !== false
        : req.body.showPopularShowcase === "true" || req.body.showPopularShowcase === true,
      showDiscountShowcase: req.body.showDiscountShowcase === undefined
        ? current.showDiscountShowcase !== false
        : req.body.showDiscountShowcase === "true" || req.body.showDiscountShowcase === true,
    };
    const logo = req.files?.logo?.[0];
    const footerLogo = req.files?.footerLogo?.[0];
    if (logo) data.logoUrl = `/uploads/site/${logo.filename}`;
    if (footerLogo) data.footerLogoUrl = `/uploads/site/${footerLogo.filename}`;

    const saved = await updateSiteSettings(data);
    const replaced = [];
    if (logo && current.logoUrl) replaced.push(current.logoUrl);
    if (footerLogo && current.footerLogoUrl) replaced.push(current.footerLogoUrl);
    for (const url of replaced) {
      if (!url.startsWith("/uploads/site/")) continue;
      await unlink(path.resolve("public", url.slice(1))).catch(() => {});
    }
    return res.json({ message: "تنظیمات ظاهری سایت ذخیره شد.", data: saved });
  } catch (error) {
    await Promise.all(files.map((file) => unlink(file.path).catch(() => {})));
    console.error("Update site settings error:", error);
    return res.status(500).json({ message: "ذخیره تنظیمات سایت ناموفق بود." });
  }
};
