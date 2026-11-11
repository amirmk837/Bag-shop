import prisma from "../config/prisma.js";

const ID = 1;
const DEFAULTS = {
  id: ID,
  eyebrow: "آشنایی با ما",
  title: "درباره فروشگاه کاظمی",
  intro: "در فروشگاه کاظمی تلاش می‌کنیم تجربه‌ای روشن و مطمئن برای انتخاب کیف، کوله‌پشتی و لوازم جانبی فراهم کنیم.",
  storyTitle: "داستان ما",
  story: "فروشگاه کاظمی با تمرکز بر عرضه محصولات کاربردی و انتخاب‌های متنوع شکل گرفته است. هدف ما این است که اطلاعات محصولات شفاف باشد تا بتوانید با آگاهی بیشتری انتخاب کنید.",
  mission: "فراهم‌کردن تجربه خرید ساده، دسترسی به اطلاعات روشن محصولات و همراهی مشتری در مسیر انتخاب و دریافت سفارش.",
  vision: "ساختن تجربه‌ای قابل اعتماد و پیوسته که در آن کیفیت خدمات، پاسخ‌گویی و شفافیت در اولویت باشد.",
  values: [
    { title: "شفافیت", description: "ارائه اطلاعات روشن و قابل فهم درباره محصولات و فرایند خرید." },
    { title: "پاسخ‌گویی", description: "توجه به پرسش‌ها و پیگیری درخواست‌های مشتریان." },
    { title: "انتخاب آگاهانه", description: "کمک به مقایسه و انتخاب محصول متناسب با نیاز." },
  ],
  contactText: "برای پرسش درباره محصولات یا سفارش‌ها، از راه‌های ارتباطی درج‌شده در سایت با ما در تماس باشید.",
  isPublished: false,
};

export const getAboutPage = async () =>
  (await prisma.aboutPage.findUnique({ where: { id: ID } })) || DEFAULTS;

export const updateAboutPage = async (data) =>
  prisma.aboutPage.upsert({
    where: { id: ID },
    create: { ...DEFAULTS, ...data },
    update: data,
  });
