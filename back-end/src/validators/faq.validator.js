import { z } from "zod";

const plainText = (max, label, min = 1) =>
  z.string().trim()
    .min(min, `${label} الزامی است.`)
    .max(max, `${label} بیش از حد طولانی است.`)
    .refine((value) => !/[<>]/.test(value), `${label} باید متن ساده باشد.`)
    .refine((value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value), `${label} شامل نویسه نامعتبر است.`);

const optionalLink = z.string().trim().max(2048, "لینک بیش از حد طولانی است.")
  .transform((value) => value || null)
  .refine((value) => {
    if (value === null) return true;
    if (/^[\u0000-\u0020\\\\]/.test(value)) return false;
    if (value.startsWith("/")) return !value.startsWith("//") && !/[\\\\]/.test(value);
    if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^https?:\\/\\//i.test(value)) return false;
    try {
      const url = new URL(/^https?:\\/\\//i.test(value) ? value : `https://${value}`);
      return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "لینک باید یک آدرس داخلی یا URL معتبر HTTP/HTTPS باشد.")
  .transform((value) => {
    if (value === null || value.startsWith("/")) return value;
    return new URL(/^https?:\\/\\//i.test(value) ? value : `https://${value}`).toString();
  });

export const faqItemSchema = z.object({
  question: plainText(240, "پرسش"),
  answer: plainText(5000, "پاسخ"),
  linkText: z.string().trim().max(80, "متن لینک بیش از حد طولانی است.")
    .transform((value) => value || null)
    .refine((value) => value === null || !/[<>\u0000-\u001F]/.test(value), "متن لینک معتبر نیست."),
  linkUrl: optionalLink,
  sortOrder: z.coerce.number().int().min(0).max(100000),
  isActive: z.boolean(),
}).strict().superRefine((data, ctx) => {
  if (Boolean(data.linkText) !== Boolean(data.linkUrl)) {
    ctx.addIssue({
      code: "custom",
      path: ["linkUrl"],
      message: "برای لینک، هم متن و هم آدرس باید وارد شوند.",
    });
  }
});
