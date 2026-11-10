import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getProductsPage } from "../../services/api";
import DiscountProductCard from "../../components/DiscountProductCard";

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
    return () => { active = false; };
  }, []);

  // توقف خودکارسازی در زمان تعامل، مخفی بودن تب و کاهش حرکت.
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches);
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    updateMotionPreference();
    updateVisibility();
    motionQuery.addEventListener?.("change", updateMotionPreference);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      motionQuery.removeEventListener?.("change", updateMotionPreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  // حرکت خودکار هر ۵ ثانیه؛ بعد از تعامل دستی، تایمر از نو شروع می‌شود.
  useEffect(() => {
    if (products.length < 2 || isHovered || isFocused || !documentVisible || reducedMotion) return;
    const timer = window.setTimeout(() => scrollProducts(1), 5000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, products.length, isHovered, isFocused, documentVisible, reducedMotion, scrollProducts]);

  const scrollProducts = useCallback((direction) => {
    const scroller = scrollerRef.current;
    if (!scroller || products.length < 2) return;
    const nextIndex = (activeIndex + direction + products.length) % products.length;
    const nextCard = scroller.querySelectorAll("[data-discount-card]")[nextIndex];
    nextCard?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "start" });
    setActiveIndex(nextIndex);
  }, [activeIndex, products.length, reducedMotion]);

  return (
    <section dir="rtl" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onFocusCapture={() => setIsFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false); }} className="relative isolate mx-auto my-14 w-full max-w-7xl overflow-hidden px-3 sm:my-20 sm:px-5">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-8 -z-10 h-72 w-72 rounded-full bg-rose-500/20 blur-[110px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-20 -z-10 h-72 w-72 rounded-full bg-orange-400/15 blur-[110px]" />

      <div className="relative overflow-hidden rounded-[1.8rem] border border-rose-300/20 bg-[#0b1019] p-4 shadow-[0_28px_90px_rgba(0,0,0,.4)] sm:rounded-[2.2rem] sm:p-6 lg:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,.17),transparent_42%),radial-gradient(ellipse_at_bottom_left,rgba(249,115,22,.12),transparent_44%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-10 top-8 -z-0 rotate-[-12deg] select-none text-[8rem] font-black leading-none text-white/[0.025] sm:text-[12rem]">٪</div>

        <div className="relative mb-6 overflow-hidden rounded-2xl border border-orange-300/20 bg-gradient-to-l from-[#541c2a] via-[#351b2b] to-[#171a29] p-4 sm:mb-7 sm:rounded-[1.6rem] sm:p-6 lg:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_25%,rgba(255,255,255,.12)_25%,rgba(255,255,255,.12)_26%,transparent_26%,transparent_74%,rgba(255,255,255,.1)_74%,rgba(255,255,255,.1)_75%,transparent_75%)] [background-size:28px_28px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -left-8 -top-16 h-48 w-48 rounded-full bg-orange-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-200/25 bg-black/20 px-3 py-1.5 text-[10px] font-black tracking-[.12em] text-rose-100 sm:text-xs">
                <span className="h-2 w-2 animate-pulse rounded-full bg-orange-300 shadow-[0_0_12px_rgba(253,186,116,.9)]" />
                پیشنهادهای ویژه فروشگاه کاظمی
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                وقتشه <span className="bg-gradient-to-l from-amber-200 via-orange-300 to-rose-300 bg-clip-text text-transparent">کمتر هزینه کنی!</span>
              </h2>
              <p className="mt-2 max-w-xl text-xs leading-6 text-rose-100/70 sm:text-sm">محصولات تخفیف‌دار را با قیمت جدید ببین؛ تخفیف مستقیم روی قیمت محصول.</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden h-20 w-20 rotate-6 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.07] text-5xl font-black text-orange-200 shadow-xl sm:flex">٪</div>
              <Link to="/discounts" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-amber-300 to-orange-400 px-5 text-xs font-black text-[#21130a] shadow-[0_10px_30px_rgba(249,115,22,.25)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(249,115,22,.35)] sm:h-12 sm:px-6 sm:text-sm">
                دیدن همه تخفیف‌ها <span aria-hidden="true">←</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col gap-3 border-b border-white/[0.09] pb-4 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-rose-400 to-orange-300" />
              <h3 className="text-base font-black text-white sm:text-lg">پیشنهادهای داغ اینجاست</h3>
              {!loading && !error && products.length > 0 && <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold text-rose-200">{products.length.toLocaleString("fa-IR")} محصول</span>}
            </div>
            <p className="pr-3 text-[10px] text-zinc-500 sm:text-xs">برای دیدن محصولات بیشتر، به چپ و راست حرکت کن.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden sm:gap-4" aria-label="در حال بارگذاری محصولات تخفیف‌دار">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="w-[calc((100%-0.75rem)/2)] shrink-0 animate-pulse sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
                <div className="aspect-[4/3] rounded-2xl bg-zinc-800/80" />
                <div className="mt-3 h-4 w-3/4 rounded bg-zinc-800" />
                <div className="mt-3 h-4 w-1/2 rounded bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p role="status" className="rounded-2xl border border-red-400/15 bg-red-400/[0.06] p-5 text-sm text-red-200/80">پیشنهادهای ویژه در حال حاضر بارگذاری نشدند.</p>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-300/20 bg-orange-300/[0.08] text-xl text-orange-200">٪</div>
            <p className="font-bold text-zinc-200">فعلاً پیشنهاد تخفیف‌داری نداریم.</p>
            <p className="mt-2 text-xs text-zinc-500 sm:text-sm">به‌محض ثبت تخفیف معتبر، محصولات این بخش نمایش داده می‌شوند.</p>
          </div>
        ) : (
          <div className="relative">
            <div ref={scrollerRef} dir="rtl" className="discount-carousel-scrollbar flex select-none snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 motion-reduce:scroll-auto sm:gap-4">
              {products.map((product) => (
                <div data-discount-card key={product.productCode} className="w-[calc((100%-0.75rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
                  <DiscountProductCard product={product} />
                </div>
              ))}
              {products.length === 10 && (
                <div className="w-[calc((100%-0.75rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
                  <Link to="/discounts" className="group flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-orange-300/35 bg-gradient-to-br from-[#321c28] via-[#211b29] to-[#111824] p-5 text-center transition hover:border-orange-300/70 hover:from-[#49202d] sm:rounded-[1.4rem]">
                    <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-200/20 bg-orange-300/10 text-3xl font-black text-orange-200 transition group-hover:scale-110">٪</span>
                    <strong className="text-base font-black text-white">هنوز تخفیف‌های بیشتری هست!</strong>
                    <span className="mt-2 text-xs leading-6 text-zinc-400">همه محصولات تخفیف‌دار را یک‌جا ببین.</span>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-amber-300 to-orange-400 px-4 py-2.5 text-xs font-black text-[#21130a]">مشاهده همه تخفیف‌ها <span aria-hidden="true">←</span></span>
                  </Link>
                </div>
              )}
            </div>
            {products.length > 4 && (
              <>
                <button type="button" onClick={() => scrollProducts(1)} aria-label="محصول بعدی" className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-2xl text-white backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-11 sm:w-11">‹</button>
                <button type="button" onClick={() => scrollProducts(-1)} aria-label="محصول قبلی" className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-2xl text-white backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-11 sm:w-11">›</button>
                <div dir="ltr" className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-3 py-2 backdrop-blur-sm">
                  {products.map((product, index) => (
                    <button key={product.productCode} type="button" onClick={() => {
                      const card = scrollerRef.current?.querySelectorAll("[data-discount-card]")[index];
                      card?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "start" });
                      setActiveIndex(index);
                    }} aria-label={`رفتن به محصول ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined}
                      className={`h-2 rounded-full transition-all duration-300 ${index === activeIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default DiscountShowcase;
