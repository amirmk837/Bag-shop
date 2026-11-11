import { aboutPageSchema } from "../validators/aboutPage.validator.js";
import { getAboutPage, updateAboutPage } from "../services/aboutPage.service.js";

export const getPublicAboutPageController = async (_req, res) => {
  try {
    const page = await getAboutPage();
    if (!page.isPublished) {
      return res.status(404).json({ message: "صفحه درباره ما هنوز منتشر نشده است." });
    }
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json({ data: page });
  } catch (error) {
    console.error("Get public about page error:", error);
    return res.status(500).json({ message: "دریافت صفحه درباره ما ناموفق بود." });
  }
};

export const getAdminAboutPageController = async (_req, res) => {
  try {
    return res.json({ data: await getAboutPage() });
  } catch (error) {
    console.error("Get admin about page error:", error);
    return res.status(500).json({ message: "دریافت محتوای درباره ما ناموفق بود." });
  }
};

export const updateAboutPageController = async (req, res) => {
  const parsed = aboutPageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message || "اطلاعات صفحه درباره ما معتبر نیست.",
      errors: parsed.error.issues.map(({ path, message }) => ({ field: path.join("."), message })),
    });
  }

  try {
    const data = await updateAboutPage(parsed.data);
    return res.json({ message: "محتوای صفحه درباره ما ذخیره شد.", data });
  } catch (error) {
    console.error("Update about page error:", error);
    return res.status(500).json({ message: "ذخیره محتوای درباره ما ناموفق بود." });
  }
};
