import path from "node:path";
import { unlink } from "node:fs/promises";
import {
  activateBanner,
  createBanner,
  deleteBanner,
  getActiveBanners,
  getAdminBanners,
  updateBanner,
} from "../services/banner.service.js";

const sendError = (res, error, fallback) => {
  console.error(fallback, error);

  return res.status(error.status || 500).json({
    message: error.status ? error.message : fallback,
  });
};

// =========================================
// PUBLIC: ACTIVE BANNER
// =========================================

export const getActiveBannerController = async (req, res) => {
  try {
    const banner = await getActiveBanners();

    return res.status(200).json({
      data: banner,
    });
  } catch (error) {
    return sendError(res, error, "دریافت بنر فعال ناموفق بود.");
  }
};

// =========================================
// ADMIN: ALL BANNERS
// =========================================

export const getAdminBannersController = async (req, res) => {
  try {
    const banners = await getAdminBanners();

    return res.status(200).json({
      data: banners,
    });
  } catch (error) {
    return sendError(res, error, "دریافت فهرست بنرها ناموفق بود.");
  }
};

// =========================================
// ADMIN: CREATE BANNER
// =========================================

export const createBannerController = async (req, res) => {
  const uploadedFiles = Object.values(req.files || {}).flat();

  try {
    const desktopFile = req.files?.desktopImage?.[0];
    const mobileFile = req.files?.mobileImage?.[0];

    if (!desktopFile || !mobileFile) {
      return res.status(400).json({
        message: "تصویر دسکتاپ و موبایل هر دو الزامی هستند.",
      });
    }

    const originalName = path.parse(
      path.basename(desktopFile.originalname),
    ).name;

    const name =
      typeof req.body.name === "string" && req.body.name.trim()
        ? req.body.name.trim()
        : originalName;

    const banner = await createBanner({
      name,
      imageUrl: `/uploads/banners/${desktopFile.filename}`,
      desktopImageUrl: `/uploads/banners/${desktopFile.filename}`,
      mobileImageUrl: `/uploads/banners/${mobileFile.filename}`,
      linkUrl: req.body.linkUrl,
      fit: req.body.fit || "contain",
      isActive: req.body.isActive === "true",
    });

    return res.status(201).json({
      message: "بنر با موفقیت ذخیره شد.",
      data: banner,
    });
  } catch (error) {
    await Promise.all(
      uploadedFiles.map((file) => unlink(file.path).catch(() => {})),
    );

    return sendError(error.status ? res : res, error, "ذخیره بنر ناموفق بود.");
  }
};

// =========================================
// ADMIN: UPDATE BANNER SETTINGS
// =========================================

export const updateBannerController = async (req, res) => {
  try {
    const banner = await updateBanner(req.params.id, req.body);

    return res.status(200).json({
      message: "تنظیمات بنر ذخیره شد.",
      data: banner,
    });
  } catch (error) {
    return sendError(res, error, "ذخیره تنظیمات بنر ناموفق بود.");
  }
};

// =========================================
// ADMIN: ACTIVATE BANNER
// =========================================

export const activateBannerController = async (req, res) => {
  try {
    const banner = await activateBanner(req.params.id);

    return res.status(200).json({
      message: "بنر با موفقیت فعال شد.",
      data: banner,
    });
  } catch (error) {
    return sendError(res, error, "فعال‌سازی بنر ناموفق بود.");
  }
};

// =========================================
// ADMIN: DELETE BANNER
// =========================================

export const deleteBannerController = async (req, res) => {
  try {
    const { deletedBanner } = await deleteBanner(req.params.id);

    const imageUrls = new Set([
      deletedBanner.imageUrl,
      deletedBanner.desktopImageUrl,
      deletedBanner.mobileImageUrl,
    ]);

    for (const imageUrl of imageUrls) {
      if (!imageUrl?.startsWith("/uploads/banners/")) continue;

      const filename = path.basename(imageUrl);
      const filePath = path.resolve("public", "uploads", "banners", filename);

      await unlink(filePath).catch((error) => {
        if (error.code !== "ENOENT") {
          console.error("Delete banner image error:", error);
        }
      });
    }

    return res.status(200).json({
      message: "بنر با موفقیت حذف شد.",
      data: { deletedBanner, activeBanner: null },
    });
  } catch (error) {
    return sendError(res, error, "حذف بنر ناموفق بود.");
  }
};
