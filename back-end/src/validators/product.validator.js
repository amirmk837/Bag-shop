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

  price: z.number().int().nonnegative("قیمت نمی‌تواند منفی باشد"),

  description: z.string().nullable().optional(),

  specifications: z.array(z.object({
    label: z.string().trim().min(1).max(80),
    value: z.string().trim().min(1).max(500),
  })).max(50).optional(),

  images: z.array(z.string()),

  colorStocks: z.array(colorStockSchema).max(30).optional(),
});

const updateProductSchema = productSchema.omit({
  productCode: true,
});

export { productSchema, updateProductSchema, colorStockSchema };
