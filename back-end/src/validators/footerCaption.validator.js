import { z } from "zod";

export const footerCaptionSchema = z.object({
  footerCaption: z
    .string()
    .trim()
    .max(180, "متن کپی‌رایت نباید بیشتر از ۱۸۰ کاراکتر باشد.")
    .refine((value) => !/[<>]/.test(value), {
      message: "متن کپی‌رایت فقط باید شامل متن ساده باشد.",
    })
    .optional(),
});
