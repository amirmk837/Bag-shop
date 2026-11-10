import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getProductsPage } from "../../services/api";
import DiscountProductCard from "../../components/DiscountProductCard";
import { useAuth } from "../../context/useAuth";

const DiscountShowcase = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const scrollerRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    let active = true;
    const loadDiscounts = async () => {
      try {
        const result = await getProductsPage({ page: 1, limit: 24, discountedOnly: true, sortBy: "discountPercent", sortOrder: "desc" });
        if (active) {
          setProducts(result.products.filter((product) => {
            const original = Number(product.price);
            const final = Number(product.discountedPrice);
            return Number.isSafeInteger(original) && Number.isSafeInteger(final) && original > 0 && final > 0 && final < original;
          }).slice(0, 10));
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "دریافت پیشنهادهای ویژه ناموفق بود.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDiscounts();
    const goToProduct = (index) => {
    const card = scrollerRef.current?.querySelectorAll("[data-discount-card]")[index];
    if (!card) return;
    card.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "start" });
    setActiveIndex(index);
  };

  return (
    <section dir="rtl" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onFocusCapture={() => setIsFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false); }} className="mx-auto my-12 w-full max-w-[1600px] px-3 sm:my-16 sm:px-5">
      <div className="relative overflow-hidden rounded-[1.35rem] border border-orange-300/30 bg-gradient-to-l from-[#ff7138] via-[#ff5b35] to-[#ff7438] p-3 shadow-[0_18px_55px_rgba(194,65,30,.2)] sm:rounded-[1.7rem] sm:p-5 lg:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_12%_20%,white_0,transparent_22%),repeating-radial-gradient(circle_at_100%_0%,transparent_0_18px,rgba(255,255,255,.22)_19px_25px,transparent_26px_42px)]" />
        {user?.role === "ADMIN" && <Link to="/admin/products" aria-label="مدیریت محصولات و تخفیف‌ها" title="مدیریت محصولات و تخفیف‌ها" className="absolute left-3 top-3 z-30 inline-flex h-9 items-center gap-2 rounded-xl border border-white/70 bg-white px-3 text-xs font-bold text-slate-700 shadow-md transition hover:-translate-y-0.5 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><span>محصولات</span><span aria-hidden="true">⚙</span></Link>}

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
          <div className="order-1 flex shrink-0 flex-col justify-center px-2 pb-1 pt-9 text-white sm:px-3 lg:order-2 lg:w-[190px] lg:pt-5 xl:w-[220px]">
            <div className="mb-2 flex items-center gap-2 text-xs font-black text-white/90 sm:text-sm"><span className="h-2 w-2 animate-pulse rounded-full bg-white shadow-[0_0_12px_white]" />پیشنهادهای ویژه فروشگاه</div>
            <div className="flex items-center gap-3 lg:block"><span className="text-5xl font-black leading-none drop-shadow sm:text-6xl lg:text-7xl">٪</span><div><h2 className="text-xl font-black leading-tight sm:text-2xl lg:mt-2 lg:text-[1.7rem]">پیشنهاد شگفت‌انگیز!</h2><p className="mt-1 text-xs font-bold leading-6 text-white/90 sm:text-sm">جا نمونی مشتی :-)</p></div></div>
            <Link to="/discounts" className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg border border-white/25 bg-[#e94c2d]/80 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#d83e26] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">مشاهده همه تخفیف‌ها <span aria-hidden="true">‹</span></Link>
          </div>

          <div className="order-2 min-w-0 flex-1 lg:order-1 lg:py-1">
            {loading ? (
              <div className="flex gap-2 overflow-hidden sm:gap-3" aria-label="در حال بارگذاری محصولات تخفیف‌دار">{Array.from({ length: 4 }, (_, index) => <div key={index} className="w-[calc((100%-0.5rem)/2)] shrink-0 animate-pulse rounded-2xl bg-white/35 sm:w-[calc((100%-2.25rem)/4)]"><div className="aspect-[4/3] rounded-t-2xl bg-white/50" /><div className="space-y-2 p-3"><div className="h-3 rounded bg-white/50" /><div className="h-3 w-2/3 rounded bg-white/50" /></div></div>)}</div>
            ) : error ? (
              <p role="status" className="rounded-xl bg-white/90 p-5 text-sm font-bold text-red-700">پیشنهادهای ویژه در حال حاضر بارگذاری نشدند.</p>
            ) : products.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-white/50 bg-white/90 p-6 text-center text-slate-700"><span className="text-4xl font-black text-orange-500">٪</span><p className="mt-2 font-black">فعلاً پیشنهاد تخفیف‌داری نداریم.</p><p className="mt-1 text-xs text-slate-500">با ثبت تخفیف معتبر، محصولات اینجا نمایش داده می‌شوند.</p></div>
            ) : (
              <div className="relative min-w-0" role="region" aria-roledescription="carousel" aria-label="محصولات تخفیف‌دار">
                <div ref={scrollerRef} dir="rtl" className="discount-carousel-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 sm:gap-3 motion-reduce:scroll-auto">
                  {products.map((product) => <div data-discount-card key={product.productCode} className="w-[calc((100%-0.5rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2.25rem)/4)] lg:w-[calc((100%-3rem)/4)]"><DiscountProductCard product={product} /></div>)}
                  {products.length >= 8 && <div data-discount-card className="w-[calc((100%-0.5rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2.25rem)/4)]"><Link to="/discounts" className="flex h-full min-h-[270px] flex-col items-center justify-center rounded-2xl border border-white/80 bg-white/90 p-4 text-center text-slate-700 shadow-md transition hover:-translate-y-1 hover:bg-white"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-3xl font-black text-orange-500">٪</span><strong className="mt-4 text-sm font-black">تخفیف‌های بیشتر</strong><span className="mt-2 text-xs leading-5 text-slate-500">همه پیشنهادها را ببین</span><span className="mt-4 rounded-lg bg-orange-500 px-3 py-2 text-xs font-black text-white">مشاهده همه</span></Link></div>}
                </div>
                {products.length > 4 && <>
                  <button type="button" onClick={() => scrollProducts(1)} aria-label="محصول بعدی" className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-2xl text-slate-700 shadow-lg transition hover:scale-105 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-10 sm:w-10">‹</button>
                  <button type="button" onClick={() => scrollProducts(-1)} aria-label="محصول قبلی" className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-2xl text-slate-700 shadow-lg transition hover:scale-105 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-10 sm:w-10">›</button>
                  <div dir="ltr" className="mt-2 flex justify-center gap-1.5">{products.map((product, index) => <button key={product.productCode} type="button" onClick={() => goToProduct(index)} aria-label={`رفتن به محصول ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/55 hover:bg-white"}`} />)}</div>
                </>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscountShowcase;
