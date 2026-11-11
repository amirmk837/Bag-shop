const createError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const normalizeSocialUrl = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw createError(400, "لینک باید متن باشد.");
  const input = value.trim();
  if (!input) return null;
  if (input.length > 2048 || /[\u0000-\u001F\\]/.test(input)) {
    throw createError(400, "لینک نامعتبر است.");
  }
  const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  try {
    const url = new URL(normalized);
    if (url.protocol !== "https:" || !url.hostname || !url.hostname.includes(".") || url.username || url.password) {
      throw new Error("Invalid URL");
    }
    return url.toString();
  } catch {
    throw createError(400, "لینک معتبر HTTPS وارد کن.");
  }
};

export const normalizeChannelName = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw createError(400, "نام کانال باید متن باشد.");
  const name = value.trim();
  if (name.length > 100 || /[<>\u0000-\u001F]/.test(name)) {
    throw createError(400, "نام کانال نامعتبر است (حداکثر ۱۰۰ کاراکتر و فقط متن ساده).");
  }
  return name || null;
};

export const normalizeSortOrder = (value) => {
  const order = Number(value ?? 0);
  if (!Number.isInteger(order) || order < 0 || order > 10000) {
    throw createError(400, "ترتیب نمایش باید عدد صحیح بین صفر تا ۱۰۰۰۰ باشد.");
  }
  return order;
};

export const normalizeActive = (value) => {
  if (value === undefined) return true;
  if (typeof value !== "boolean") throw createError(400, "وضعیت نمایش نامعتبر است.");
  return value;
};



export const normalizeSocialPlatform = (value) => {
  if (typeof value !== "string") throw createError(400, "شناسه پلتفرم نامعتبر است.");
  const platform = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(platform)) {
    throw createError(400, "شناسه پلتفرم باید ۲ تا ۴۰ کاراکتر انگلیسی، عدد یا زیرخط باشد.");
  }
  return platform;
};

export const normalizeSocialLabel = (value) => {
  if (typeof value !== "string") throw createError(400, "نام پلتفرم الزامی است.");
  const label = value.trim();
  if (!label || label.length > 60 || /[<>\u0000-\u001F]/.test(label)) {
    throw createError(400, "نام پلتفرم باید بین ۱ تا ۶۰ کاراکتر متن ساده باشد.");
  }
  return label;
};
