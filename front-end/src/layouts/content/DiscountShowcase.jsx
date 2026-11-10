import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getProductsPage } from "../../services/api";
import DiscountProductCard from "../../components/DiscountProductCard";

const DiscountShowcase = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const scrollerRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadDiscounts = async () => {
      try {
        const result = await getProductsPage({
          page: 1,
          limit: 24,
          discountedOnly: true,
          sortBy: "discountPercent",
          sortOrder: "desc",
        });
        if (active) {
          setProducts(
            result.products.filter((product) => {
              const original = Number(product.price);
              const final = Number(product.discountedPrice);
              return Number.isSafeInteger(original) &&
                Number.isSafeInteger(final) &&
                original > 0 && final > 0 && final < original;
            }),
          );
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

  const scrollProducts = (direction) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({
      left: direction * Math.max(260, scroller.clientWidth * 0.82),
      behavior: "smooth",
    });
  };

  return (
    <section dir="rtl" className="relative isolate mx-auto my-12 w-full max-w-7xl overflow-hidden px-3 sm:my-16 sm:px-5">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-8 -z-10 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[100px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-20 -z-10 h-72 w-72 rounded-full bg-amber-400/10 blur-[110px]" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c111b] p-4 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:rounded-[2rem] sm:p-6 lg:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,.11),transparent_38%),radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,.09),transparent_42%)]" />
        <div className="relative">
          <div className="mb-6 flex flex-col gap-5 border-b border-white/[0.09] pb-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
                </span>
                <span className="text-[10px] font-extrabold tracking-[.18em] text-amber-200 sm:text-[11px]">KAZEMI • SPECIAL OFFERS</span>
              </div>
              <h2 className="text-xl font-black leading-tight tracking-tight text-white sm:text-2xl lg:text-[1.8rem]">
                فرصت‌های ویژه، <span className="bg-gradient-to-l from-amber-200 via-orange-300 to-fuchsia-300 bg-clip-text text-transparent">قیمت‌های استثنایی</span>
              </h2>
              <p className="mt-2 text-xs leading-6 text-zinc-400 sm:text-sm">فقط محصولاتی که تخفیف معتبر دارند؛ انتخاب کن و هوشمندانه‌تر خرید کن.</p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {!loading && !error && products.length > 4 && (
                <>
                  <button type="button" onClick={() => scrollProducts(-1)} aria-label="مشاهده محصولات سمت چپ" title="محصولات قبلی" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-lg text-zinc-200 transition hover:border-amber-300/40 hover:bg-amber-300/10 hover:text-amber-200">←</button>
                  <button type="button" onClick={() => scrollProducts(1)} aria-label="مشاهده محصولات بیشتر" title="محصولات بعدی" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-lg text-zinc-200 transition hover:border-amber-300/40 hover:bg-amber-300/10 hover:text-amber-200">→</button>
                </>
              )}
              <Link to="/discounts" className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-l from-amber-300 to-orange-400 px-4 text-xs font-black text-[#17120a] shadow-[0_8px_24px_rgba(245,158,11,.18)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(245,158,11,.25)]">
                مشاهده همه تخفیف‌ها <span aria-hidden="true">←</span>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-hidden" aria-label="در حال بارگذاری محصولات تخفیف‌دار">
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
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] text-xl text-amber-200">٪</div>
              <p className="font-bold text-zinc-200">فعلاً پیشنهاد تخفیف‌داری نداریم.</p>
              <p className="mt-2 text-xs text-zinc-500 sm:text-sm">به‌محض ثبت تخفیف معتبر، محصولات این بخش نمایش داده می‌شوند.</p>
            </div>
          ) : (
            <div ref={scrollerRef} dir="rtl" className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-color:rgba(245,158,11,.35)_transparent] [scrollbar-width:thin] sm:gap-4">
              {products.map((product) => (
                <div key={product.productCode} className="w-[calc((100%-0.75rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
                  <DiscountProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DiscountShowcase;
