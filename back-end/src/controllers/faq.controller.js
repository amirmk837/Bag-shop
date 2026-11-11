import { faqItemSchema } from "../validators/faq.validator.js";
import {
  getPublicFaqItems,
  getAdminFaqItems,
  createFaqItem,
  updateFaqItem,
  deleteFaqItem,
} from "../services/faq.service.js";

const sendError = (res, error, fallback) => {
  if (error.status) return res.status(error.status).json({ message: error.message });
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
};

export const getPublicFaqController = async (_req, res) => {
  try {
    const data = await getPublicFaqItems();
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json({ data });
  } catch (error) {
    return sendError(res, error, "دریافت پرسش‌های متداول ناموفق بود.");
  }
};

export const getAdminFaqController = async (_req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    return res.json({ data: await getAdminFaqItems() });
  } catch (error) {
    return sendError(res, error, "دریافت فهرست پرسش‌ها ناموفق بود.");
  }
};

const parseInput = (body) => {
  const parsed = faqItemSchema.safeParse(body);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0]?.message || "اطلاعات پرسش معتبر نیست.");
    error.status = 400;
    error.details = parsed.error.issues.map(({ path, message }) => ({ field: path.join("."), message }));
    throw error;
  }
  return parsed.data;
};

export const createFaqController = async (req, res) => {
  try {
    const data = await createFaqItem(parseInput(req.body));
    return res.status(201).json({ message: "پرسش متداول اضافه شد.", data });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ message: error.message, errors: error.details });
    }
    return sendError(res, error, "ثبت پرسش متداول ناموفق بود.");
  }
};

export const updateFaqController = async (req, res) => {
  try {
    const data = await updateFaqItem(req.params.id, parseInput(req.body));
    return res.json({ message: "پرسش متداول ذخیره شد.", data });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ message: error.message, errors: error.details });
    }
    return sendError(res, error, "ویرایش پرسش متداول ناموفق بود.");
  }
};

export const deleteFaqController = async (req, res) => {
  try {
    await deleteFaqItem(req.params.id);
    return res.json({ message: "پرسش متداول حذف شد." });
  } catch (error) {
    return sendError(res, error, "حذف پرسش متداول ناموفق بود.");
  }
};
