import { z } from "zod";

const colorSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().nullable().optional());

// ابتدا اسکیمای رنگ و موجودی تعریف می‌شود
const colorStockSchema = z.object({
  color: z.string().trim().min(1).max(50),
  count: z.number().int().min(0).max(1000000),
});

// سپس اسکیمای محصول از آن استفاده می‌کند
const productSchema = z.object({
  productCode: z.string().min(1, "کد محصول الزامی است"),

  title: z.string().min(1, "عنوان محصول الزامی است"),

  categoryId: z.number().int().positive("دسته‌بندی معتبر نیست"),

  count: z.number().int().nonnegative("موجودی نمی‌تواند منفی باشد"),

  color: colorSchema,

  price: z.number().int().positive("قیمت باید بیشتر از صفر باشد"),
  discountedPrice: z.number().int().positive().nullable().optional(),

  description: z.string().nullable().optional(),

  images: z.array(z.string()),

  colorStocks: z.array(colorStockSchema).max(30).optional(),
}).superRefine((data, ctx) => {
  if (data.discountedPrice != null && data.discountedPrice >= data.price) {
    ctx.addIssue({ code: "custom", path: ["discountedPrice"], message: "قیمت تخفیف‌خورده باید کمتر از قیمت اصلی باشد." });
  }
});

const updateProductSchema = productSchema.omit({
  productCode: true,
});

export { productSchema, updateProductSchema, colorStockSchema };
