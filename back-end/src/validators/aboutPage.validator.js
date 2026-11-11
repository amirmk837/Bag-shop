import { z } from "zod";

const plainText = (max, label, min = 0) =>
  z.string().trim().min(min, `${label} الزامی است.`).max(max, `${label} بیش از حد طولانی است.`)
    .refine((value) => !/[<>]/.test(value), `${label} باید متن ساده باشد.`)
    .refine((value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value), `${label} شامل نویسه نامعتبر است.`);

export const aboutPageSchema = z.object({
  eyebrow: plainText(80, "عنوان کوچک", 1),
  title: plainText(160, "عنوان اصلی", 1),
  intro: plainText(600, "معرفی کوتاه"),
  storyTitle: plainText(120, "عنوان داستان", 1),
  story: plainText(5000, "داستان فروشگاه"),
  mission: plainText(2000, "مأموریت"),
  vision: plainText(2000, "چشم‌انداز"),
  values: z.array(z.object({
    title: plainText(60, "عنوان ارزش", 1),
    description: plainText(240, "توضیح ارزش", 1),
  }).strict()).min(2, "حداقل دو ارزش باید ثبت شود.").max(6, "حداکثر شش ارزش قابل ثبت است."),
  contactText: plainText(600, "متن ارتباط با ما"),
  isPublished: z.boolean(),
}).strict();
