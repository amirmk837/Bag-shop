import fs from "node:fs/promises";

const UPLOAD_ERROR_MESSAGES = {
  LIMIT_FILE_SIZE: "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.",
  LIMIT_FILE_COUNT: "فقط یک تصویر در هر درخواست مجاز است.",
  LIMIT_UNEXPECTED_FILE: "فیلد ارسال تصویر معتبر نیست.",
  LIMIT_PART_COUNT: "ساختار اطلاعات ارسالی معتبر نیست.",
  LIMIT_FIELD_COUNT: "تعداد فیلدهای ارسالی بیش از حد مجاز است.",
};

const removePartialUploads = async (req) => {
  const files = [
    ...(req.file ? [req.file] : []),
    ...Object.values(req.files || {}).flat(),
  ];

  await Promise.all(
    files
      .filter((file) => typeof file?.path === "string")
      .map((file) => fs.unlink(file.path).catch(() => {})),
  );
};

export const handleUploadError = async (error, req, res, next) => {
  if (!error) return next();

  if (error.name === "MulterError") {
    await removePartialUploads(req);
    return res.status(400).json({
      success: false,
      message: UPLOAD_ERROR_MESSAGES[error.code] || "بارگذاری تصویر ناموفق بود.",
    });
  }

  if (error.message === "فقط فایل‌های JPG، PNG، WEBP و AVIF مجاز هستند.") {
    await removePartialUploads(req);
    return res.status(400).json({ success: false, message: error.message });
  }

  return next(error);
};
