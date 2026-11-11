import path from "node:path";
import { unlink } from "node:fs/promises";
import prisma from "../config/prisma.js";

import {
  getPublicFooterTrustBadges,
  getAdminFooterTrustBadges,
  createFooterTrustBadge,
  updateFooterTrustBadge,
  deleteFooterTrustBadge,
} from "../services/footerTrustBadge.service.js";

const uploadDir = path.resolve("public", "uploads", "footer-trust");

const sendError = (res, error, fallback) => {
  console.error(fallback, error);

  return res.status(error.status || 500).json({
    message: error.status ? error.message : fallback,
  });
};

const removeUploadedFile = async (file) => {
  if (!file?.path) return;

  await unlink(file.path).catch((error) => {
    if (error.code !== "ENOENT") {
      console.error("Remove uploaded footer trust image error:", error);
    }
  });
};

const removeStoredImage = async (imageUrl) => {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.startsWith("/uploads/footer-trust/")
  ) {
    return;
  }

  const filename = path.basename(imageUrl);

  if (!filename || filename === "." || filename === "..") {
    return;
  }

  const filePath = path.join(uploadDir, filename);

  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Delete footer trust image error:", error);
    }
  }
};

const removeImageIfUnused = async (imageUrl) => {
  if (
    typeof imageUrl !== "string" ||
    !imageUrl.startsWith("/uploads/footer-trust/")
  ) {
    return;
  }

  try {
    const references = await prisma.footerTrustBadge.count({
      where: { imageUrl },
    });

    if (references === 0) {
      await removeStoredImage(imageUrl);
    }
  } catch (error) {
    // در صورت خطای دیتابیس، تصویر را نگه می‌داریم تا تصویر
    // مورد استفاده یک نماد به اشتباه حذف نشود.
    console.error("Check footer trust image references error:", error);
  }
};

export const getPublicFooterTrustBadgesController = async (_req, res) => {
  try {
    const data = await getPublicFooterTrustBadges();
    return res.json({ data });
  } catch (error) {
    return sendError(res, error, "دریافت نمادهای اعتماد ناموفق بود.");
  }
};

export const getAdminFooterTrustBadgesController = async (_req, res) => {
  try {
    const data = await getAdminFooterTrustBadges();
    return res.json({ data });
  } catch (error) {
    return sendError(res, error, "دریافت فهرست نمادها ناموفق بود.");
  }
};

export const createFooterTrustBadgeController = async (req, res) => {
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({
        message: "تصویر نماد اعتماد الزامی است.",
      });
    }

    const data = await createFooterTrustBadge({
      ...req.body,
      imageUrl: `/uploads/footer-trust/${file.filename}`,
    });

    return res.status(201).json({
      message: "نماد اعتماد اضافه شد.",
      data,
    });
  } catch (error) {
    await removeUploadedFile(file);

    return sendError(res, error, "ثبت نماد اعتماد ناموفق بود.");
  }
};

export const updateFooterTrustBadgeController = async (req, res) => {
  const file = req.file;
  let updateSucceeded = false;

  try {
    const input = { ...req.body };

    // آدرس تصویر فقط از فایل آپلودشده در همین درخواست تعیین می‌شود.
    delete input.imageUrl;

    if (file) {
      input.imageUrl = `/uploads/footer-trust/${file.filename}`;
    }

    const result = await updateFooterTrustBadge(req.params.id, input);

    updateSucceeded = true;

    // تصویر قبلی فقط در صورت عدم استفاده توسط نمادهای دیگر حذف می‌شود.
    if (file && result.previousImageUrl) {
      await removeImageIfUnused(result.previousImageUrl);
    }

    return res.json({
      message: "اطلاعات نماد اعتماد ذخیره شد.",
      data: result.badge,
    });
  } catch (error) {
    // فقط وقتی عملیات دیتابیس موفق نشده، فایل جدید پاک می‌شود.
    if (!updateSucceeded) {
      await removeUploadedFile(file);
    }

    return sendError(res, error, "ویرایش نماد اعتماد ناموفق بود.");
  }
};

export const deleteFooterTrustBadgeController = async (req, res) => {
  try {
    const deleted = await deleteFooterTrustBadge(req.params.id);

    // پس از حذف رکورد، بررسی می‌کنیم تصویر جای دیگری استفاده نشده باشد.
    await removeImageIfUnused(deleted.imageUrl);

    return res.json({
      message: "نماد اعتماد حذف شد.",
    });
  } catch (error) {
    return sendError(res, error, "حذف نماد اعتماد ناموفق بود.");
  }
};
