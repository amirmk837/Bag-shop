import { useState } from "react";
import { useSiteSettings } from "../context/useSiteSettings";
import {
  isAnalyticsOptedOut,
  setAnalyticsOptOut,
} from "../services/siteAnalyticsApi";

const sections = [
  {
    title: "اطلاعات حساب کاربری",
    body: "برای ایجاد و مدیریت حساب، نام کاربری، شماره تماس در صورت ارائه و رمز عبور دریافت می‌شود. رمز عبور به‌صورت هش‌شده ذخیره می‌شود و متن اصلی آن در پایگاه داده نگهداری نمی‌شود.",
  },
  {
    title: "اطلاعات نشانی و سفارش",
    body: "برای ثبت و تحویل سفارش، اطلاعات تحویل‌گیرنده، شماره تماس، استان، شهر، نشانی، کد پستی و در صورت ارائه شماره پلاک و واحد پردازش می‌شود. جزئیات سفارش، کالاها، تعداد، قیمت زمان ثبت سفارش، روش ارسال و وضعیت پیگیری نیز برای اجرای سفارش و پشتیبانی نگهداری می‌شود.",
  },
  {
    title: "پرداخت",
    body: "در پرداخت آنلاین، فرایند پرداخت در درگاه پرداخت مربوط انجام می‌شود. فروشگاه اطلاعات لازم برای پیگیری تراکنش مانند مبلغ، وضعیت پرداخت و شناسه‌های مرجع درگاه را نگهداری می‌کند؛ اطلاعات محرمانه کارت بانکی در پایگاه داده فروشگاه ذخیره نمی‌شود.",
  },
  {
    title: "دیدگاه‌ها و پشتیبانی مشتریان",
    body: "برای ثبت دیدگاه یا پرسش درباره محصول و استفاده از پشتیبانی، متن پیام، موضوع درخواست و اطلاعات حساب کاربری شما پردازش می‌شود. دیدگاه محصول تا زمان تأیید مدیر عمومی نیست و پس از تأیید، متن و نام نمایشی حساب همراه با پاسخ فروشگاه در صفحه محصول نمایش داده می‌شود. گفت‌وگوهای پشتیبانی خصوصی هستند و فقط برای مشتری صاحب درخواست و مدیران مجاز قابل مشاهده‌اند. نام کاربری و شماره تماس ثبت‌شده در حساب، برای شناسایی درخواست در پنل مدیریت نمایش داده می‌شود.",
  },
  {
    title: "هدف استفاده و اشتراک‌گذاری",
    body: "اطلاعات حساب، نشانی و سفارش برای ارائه خدمات فروشگاه، احراز هویت، پردازش سفارش، ارسال، پشتیبانی و حفظ امنیت استفاده می‌شود. اطلاعات لازم برای انجام پرداخت یا تحویل سفارش، حسب مورد در اختیار درگاه پرداخت یا شرکت حمل‌ونقل قرار می‌گیرد. اطلاعات کاربران برای فروش به تبلیغ‌کنندگان استفاده نمی‌شود.",
  },
  {
    title: "آمار بازدید صفحات",
    body: "برای تهیه آمار داخلی، یک شناسه تصادفی مستعار در Local Storage مرورگر نگهداری می‌شود. مسیر صفحه بدون Query String و بخش پس از #، دامنه ارجاع‌دهنده و دسته‌بندی کلی مرورگر، سیستم‌عامل و نوع دستگاه ثبت می‌شود. نشانی IP در این سامانه آمار ذخیره نمی‌شود و صفحات مدیریت نیز در آمار عمومی ثبت نمی‌شوند.",
  },
  {
    title: "شناسه بازدید و کنترل آن",
    body: "شناسه مستعار مرورگر پس از ۳۰ روز منقضی می‌شود. می‌توانید با کنترل زیر ثبت بازدیدهای بعدی را غیرفعال کنید؛ در این حالت شناسه محلی حذف می‌شود. فعال‌سازی دوباره از بازدیدهای بعدی آمار ثبت می‌کند. پاک‌کردن داده‌های سایت از مرورگر نیز شناسه محلی را حذف می‌کند، اما سوابق آماری قبلی ذخیره‌شده در پایگاه داده را پاک نمی‌کند.",
  },
  {
    title: "نگهداری و درخواست اصلاح اطلاعات",
    body: "اطلاعات تا زمانی که برای ارائه خدمات، پشتیبانی، رسیدگی به اختلاف‌ها یا رعایت الزامات قانونی لازم باشد نگهداری می‌شود. برای درخواست بررسی، اصلاح یا حذف اطلاعات حساب، می‌توانید از راه‌های ارتباطی فروشگاه تماس بگیرید؛ حذف اطلاعات ممکن است به‌دلیل سوابق سفارش یا الزامات قانونی محدود شود.",
  },
];

export default function PrivacyPolicy() {
  const { siteSettings: site } = useSiteSettings();
  const [analyticsOptedOut, setAnalyticsOptedOut] = useState(isAnalyticsOptedOut);
  const [preferenceError, setPreferenceError] = useState("");

  const toggleAnalytics = () => {
    const nextValue = !analyticsOptedOut;
    if (!setAnalyticsOptOut(nextValue)) {
      setPreferenceError("ذخیره تنظیم حریم خصوصی در مرورگر ممکن نشد.");
      return;
    }
    setAnalyticsOptedOut(nextValue);
    setPreferenceError("");
  };

  return (
    <main dir="rtl" className="min-h-[60vh] bg-cyan-950 px-4 py-10 text-white sm:py-14">
      <article className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-zinc-900/80 p-5 shadow-xl sm:p-8">
        <h1 className="text-2xl font-black sm:text-3xl">حریم خصوصی</h1>
        <p className="mt-4 text-sm leading-8 text-zinc-300">
          فروشگاه کاظمی اطلاعات موردنیاز برای مدیریت حساب، ثبت و تحویل سفارش و حفظ امنیت خدمات را پردازش می‌کند.
          در این صفحه نوع اطلاعات، هدف استفاده و روش کنترل آمار بازدید توضیح داده شده است.
        </p>

        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-bold text-cyan-300">{section.title}</h2>
              <p className="mt-2 text-sm leading-8 text-zinc-300">{section.body}</p>
              {section.title === "شناسه بازدید و کنترل آن" && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-200">
                    وضعیت فعلی: {analyticsOptedOut ? "ثبت آمار بازدید غیرفعال است." : "ثبت آمار بازدید فعال است."}
                  </p>
                  <button
                    type="button"
                    onClick={toggleAnalytics}
                    className="mt-3 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                  >
                    {analyticsOptedOut ? "فعال‌کردن آمار بازدید" : "غیرفعال‌کردن آمار بازدید"}
                  </button>
                  {preferenceError && (
                    <p role="alert" className="mt-2 text-sm text-red-300">{preferenceError}</p>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        <p className="mt-8 border-t border-white/10 pt-5 text-sm leading-7 text-zinc-400">
          شماره تماس فروشگاه: {site?.phone || "از راه‌های ارتباطی درج‌شده در فوتر استفاده کنید."}
        </p>
      </article>
    </main>
  );
}
