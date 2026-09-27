import { z } from "zod";

const productSchema = z.object({
  productCode: z.string().min(1, "کد محصول الزامی است"),

  title: z.string().min(1, "عنوان محصول الزامی است"),

  categoryId: z.number().int().positive("دسته‌بندی معتبر نیست"),

  count: z.number().int().nonnegative("موجودی نمی‌تواند منفی باشد"),

  color: z.string().nullable().optional(),

  price: z.number().int().nonnegative("قیمت نمی‌تواند منفی باشد"),

  description: z.string().nullable().optional(),

  images: z.array(z.string()),
});

const updateProductSchema = productSchema
  .omit({
    productCode: true,
  })
  .partial();

export { productSchema, updateProductSchema };
