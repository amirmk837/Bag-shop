const UPLOAD_ERROR_MESSAGES = {
  LIMIT_FILE_SIZE: "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.",
  LIMIT_FILE_COUNT: "فقط یک تصویر در هر درخواست مجاز است.",
  LIMIT_UNEXPECTED_FILE: "فیلد ارسال تصویر معتبر نیست.",
  LIMIT_PART_COUNT: "ساختار اطلاعات ارسالی معتبر نیست.",
  LIMIT_FIELD_COUNT: "تعداد فیلدهای ارسالی بیش از حد مجاز است.",
};

export const handleUploadError = (error, _req, res, next) => {
  if (!error) return next();

  if (error.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: UPLOAD_ERROR_MESSAGES[error.code] || "بارگذاری تصویر ناموفق بود.",
    });
  }

  // Do not expose internal server errors or filesystem details to clients.
  if (error.message === "فقط فایل‌های JPG، PNG، WEBP و AVIF مجاز هستند.") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return next(error);
};
