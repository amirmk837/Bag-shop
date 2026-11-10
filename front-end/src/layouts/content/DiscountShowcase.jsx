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
          limit: 16,
          discountedOnly: true,
          sortBy: "discountPercent",
          sortOrder: "desc",
        });
        if (active) {
          setProducts(
            result.products.filter(
              (product) =>
                Number.isSafeInteger(product.price) &&
                Number.isSafeInteger(product.discountedPrice) &&
                product.discountedPrice > 0 &&
                product.discountedPrice < product.price,
            ),
          );
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "دریافت پیشنهادهای ویژه ناموفق بود.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDiscounts();

    return () => {
      active = false;
    };
  }, []);

  const scrollProducts = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: -scroller.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section dir="rtl" className="relative mx-auto my-10 w-full max-w-7xl overflow-hidden px-3 sm:my-14 sm:px-5">
      <div className="pointer-events-none absolute inset-x-5 top-0 h-40 rounded-[2rem] bg-gradient-to-l from-amber-500/[0.07] via-transparent to-cyan-500/[0.05] blur-2xl" />

      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5 sm:mb-7">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-px w-7 bg-amber-400" />
            <p className="text-[10px] font-bold tracking-[0.24em] text-amber-300 sm:text-xs">KAZEMI SELECT</p>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">انتخاب‌های ویژه با قیمت بهتر</h2>
          <p className="mt-2 text-xs text-zinc-500 sm:text-sm">محصولات منتخب با تخفیف واقعی و قیمت به‌روز</p>
        </div>

        <div className="flex items-center gap-2">
          {!loading && !error && products.length > 4 && (
            <button
              type="button"
              onClick={scrollProducts}
              aria-label="مشاهده محصولات تخفیف‌دار بیشتر"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/[0.07] px-4 text-xs font-bold text-amber-200 transition hover:border-amber-300/50 hover:bg-amber-300/15"
            >
              <span>محصولات بیشتر</span>
              <span aria-hidden="true" className="text-base">←</span>
            </button>
          )}
          <Link
            to="/discounts"
            className="inline-flex h-10 items-center rounded-full border border-white/10 px-4 text-xs font-semibold text-zinc-300 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
          >
            همه تخفیف‌ها
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
        <p role="status" className="rounded-xl border border-white/10 bg-zinc-900/70 p-5 text-sm text-zinc-400">
          پیشنهادهای ویژه در حال حاضر بارگذاری نشدند.
        </p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-5 py-9 text-center">
          <p className="font-bold text-zinc-200">در حال حاضر محصول تخفیف‌داری وجود ندارد.</p>
          <p className="mt-2 text-sm text-zinc-500">با ثبت تخفیف معتبر، محصولات این بخش نمایش داده می‌شوند.</p>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          dir="rtl"
          className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-color:rgba(161,161,170,.35)_transparent] [scrollbar-width:thin] sm:gap-4"
        >
          {products.map((product) => (
            <div
              key={product.productCode}
              className="w-[calc((100%-0.75rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
            >
              <DiscountProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default DiscountShowcase;
