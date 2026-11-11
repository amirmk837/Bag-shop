import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import Banner from "./Banner";
import DeferredMount from "../../components/DeferredMount";
import { useSiteSettings } from "../../context/useSiteSettings";

const Brands = lazy(() => import("./Brands"));
const DiscountShowcase = lazy(() => import("./DiscountShowcase"));
const PopularShowcase = lazy(() => import("./PopularShowcase"));

const Content = () => {
  const { siteSettings } = useSiteSettings();
  return (
    <main dir="rtl" className="relative isolate min-h-screen w-full overflow-hidden bg-[#080c13] pb-12 pt-5 text-white sm:pt-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-48 top-20 h-[28rem] w-[28rem] rounded-full bg-cyan-500/[0.07] blur-[130px]" />
        <div className="absolute -left-48 top-[38rem] h-[32rem] w-[32rem] rounded-full bg-violet-500/[0.07] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:54px_54px]" />
      </div>

      <div className="mx-auto w-full max-w-[1440px]">
        <section className="mx-auto mb-6 flex max-w-7xl flex-col gap-5 px-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-[10px] font-extrabold tracking-[.16em] text-cyan-200 sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.8)]" />
              KAZEMI STORE
            </div>
            <h1 className="text-2xl font-black leading-[1.5] tracking-tight text-white sm:text-3xl lg:text-4xl">
              انتخابی مطمئن برای <span className="bg-gradient-to-l from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">سبک زندگی شما</span>
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-7 text-zinc-400 sm:text-sm">
              مجموعه‌ای از کیف، کوله‌پشتی و لوازم کاربردی؛ محصولات را ببینید و انتخابتان را پیدا کنید.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a href="#store-categories" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-xs font-bold text-zinc-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.07] hover:text-cyan-100 sm:text-sm">دسته‌بندی محصولات</a>
            <Link to="/discounts" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-cyan-300 to-sky-500 px-4 text-xs font-black text-[#061018] shadow-[0_10px_28px_rgba(6,182,212,.18)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(6,182,212,.25)] sm:text-sm">پیشنهادهای ویژه <span aria-hidden="true">←</span></Link>
          </div>
        </section>

        <div className="px-3 sm:px-5 md:px-6">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101722] p-1.5 shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:rounded-[2rem] sm:p-2">
            <Banner />
          </div>
        </div>

        <div className="mx-auto mt-5 grid max-w-7xl grid-cols-3 gap-2 px-3 sm:mt-6 sm:gap-3 sm:px-6 lg:px-8">
          {[
            { icon: "◈", title: "انتخاب متنوع", detail: "دسته‌بندی‌های کاربردی", tone: "text-cyan-200" },
            { icon: "٪", title: "پیشنهادهای ویژه", detail: "قیمت‌های تخفیف‌دار", tone: "text-amber-200" },
            { icon: "↗", title: "خرید آسان", detail: "دسترسی سریع به محصولات", tone: "text-violet-200" },
          ].map((item) => (
            <div key={item.title} className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-2.5 py-3 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-4">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-lg sm:h-10 sm:w-10 sm:rounded-xl ${item.tone}`}>{item.icon}</span>
              <span className="min-w-0">
                <span className="block truncate text-[10px] font-extrabold text-zinc-100 sm:text-sm">{item.title}</span>
                <span className="mt-1 hidden truncate text-[10px] text-zinc-500 sm:block">{item.detail}</span>
              </span>
            </div>
          ))}
        </div>

        {siteSettings?.showPopularShowcase !== false && (
          <Suspense fallback={<div aria-hidden="true" className="min-h-[260px]" />}>
            <PopularShowcase />
          </Suspense>
        )}
        {siteSettings?.showDiscountShowcase !== false && (
          <Suspense fallback={<div aria-hidden="true" className="min-h-[260px]" />}>
            <DiscountShowcase />
          </Suspense>
        )}

        <DeferredMount rootMargin="500px 0px" minHeight={300}>
          <Suspense fallback={<div aria-hidden="true" className="min-h-[260px]" />}>
            <Brands />
          </Suspense>
        </DeferredMount>
      </div>
    </main>
  );
};

export default Content;
