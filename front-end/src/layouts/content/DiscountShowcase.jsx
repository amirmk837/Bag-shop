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
  const [reducedMotion, setReducedMotion] = useState(false);
  const scrollerRef = useRef(null);
  const { user } = useAuth();

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
            result.products
              .filter((product) => {
                const original = Number(product.price);
                const final = Number(product.discountedPrice);
                return Number.isSafeInteger(original) && Number.isSafeInteger(final) &&
                  original > 0 && final > 0 && final < original;
              })
              .slice(0, 10),
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

  const scrollProducts = useCallback((direction) => {
    const cards = scrollerRef.current?.querySelectorAll("[data-discount-card]");
    if (!cards?.length) return;

    // حرکت مرحله‌ای؛ در ابتدا و انتهای لیست حلقه نمی‌زند.
    const nextIndex = Math.min(
      Math.max(activeIndex + direction, 0),
      cards.length - 1,
    );
    if (nextIndex === activeIndex) return;

    cards[nextIndex].scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });
    setActiveIndex(nextIndex);
  }, [activeIndex, reducedMotion]);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches);
    updateMotionPreference();
    motionQuery.addEventListener?.("change", updateMotionPreference);
    return () => motionQuery.removeEventListener?.("change", updateMotionPreference);
  }, []);

  return (
    <section
      dir="rtl"
      className="mx-auto my-10 w-full max-w-[1600px] px-3 sm:my-14 sm:px-5"
    >
      <div className="relative overflow-hidden rounded-[1.35rem] border border-cyan-800/60 bg-gradient-to-br from-[#102b38] via-[#0b2633] to-[#101b2b] p-3 shadow-[0_18px_55px_rgba(0,0,0,.38),inset_0_1px_0_rgba(255,255,255,.05)] sm:rounded-[1.7rem] sm:p-5 lg:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_12%_20%,rgba(34,211,238,.22)_0,transparent_25%),repeating-radial-gradient(circle_at_100%_0%,transparent_0_18px,rgba(103,232,249,.07)_19px_25px,transparent_26px_42px)]"
        />

        {user?.role === "ADMIN" && (
          <Link
            to="/admin/products"
            aria-label="مدیریت محصولات و تخفیف‌ها"
            title="مدیریت محصولات و تخفیف‌ها"
            className="absolute left-3 top-3 z-30 inline-flex h-9 items-center gap-2 rounded-xl border border-cyan-700/70 bg-slate-950/80 px-3 text-xs font-bold text-cyan-100 shadow-md transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-cyan-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:left-5 sm:top-4"
          >
            محصولات <span aria-hidden="true">⚙</span>
          </Link>
        )}

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
          <div className="order-1 flex shrink-0 flex-col justify-center px-2 pb-1 pt-9 text-slate-100 sm:px-3 lg:w-[190px] lg:pt-5 xl:w-[220px]">
            <div className="mb-2 flex items-center gap-2 text-xs font-black text-cyan-200 sm:text-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.8)]" />
              پیشنهادهای ویژه فروشگاه
            </div>
            <div className="flex items-center gap-3 lg:block">
              <span className="text-5xl font-black leading-none text-cyan-300 drop-shadow sm:text-6xl lg:text-7xl">٪</span>
              <div>
                <h2 className="text-xl font-black leading-tight sm:text-2xl lg:mt-2 lg:text-[1.7rem]">
                  پیشنهاد شگفت‌انگیز!
                </h2>
                <p className="mt-1 text-xs font-bold leading-6 text-slate-300 sm:text-sm">
                  جا نمونی مشتی :-)
                </p>
              </div>
            </div>
            <Link
              to="/discounts"
              className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg border border-cyan-700/60 bg-cyan-950/70 px-3 py-2 text-xs font-black text-cyan-100 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-cyan-800/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              مشاهده همه تخفیف‌ها <span aria-hidden="true">‹</span>
            </Link>
          </div>

          <div className="order-2 min-w-0 flex-1 lg:py-1">
            {loading ? (
              <div className="flex gap-2 overflow-hidden sm:gap-3" aria-label="در حال بارگذاری محصولات تخفیف‌دار">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="w-[calc((100%-0.5rem)/2)] shrink-0 animate-pulse rounded-2xl border border-cyan-800/60 bg-slate-950/65 sm:w-[calc((100%-2.25rem)/4)]"
                  >
                    <div className="aspect-[4/3] rounded-t-2xl bg-slate-800/80" />
                    <div className="space-y-2 p-3">
                      <div className="h-3 rounded bg-slate-700" />
                      <div className="h-3 w-2/3 rounded bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <p role="status" className="rounded-xl border border-rose-900/60 bg-slate-950/80 p-5 text-sm font-bold text-rose-200">
                پیشنهادهای ویژه در حال حاضر بارگذاری نشدند.
              </p>
            ) : products.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-cyan-900/60 bg-slate-950/65 p-6 text-center text-slate-200">
                <span className="text-4xl font-black text-cyan-300">٪</span>
                <p className="mt-2 font-black">فعلاً پیشنهاد تخفیف‌داری نداریم.</p>
                <p className="mt-1 text-xs text-slate-400">با ثبت تخفیف معتبر، محصولات اینجا نمایش داده می‌شوند.</p>
              </div>
            ) : (
              <div className="relative min-w-0" role="region" aria-roledescription="carousel" aria-label="محصولات تخفیف‌دار">
                <div
                  ref={scrollerRef}
                  dir="rtl"
                  onScroll={(event) => {
                    const container = event.currentTarget;
                    const cards = Array.from(container.querySelectorAll("[data-discount-card]"));
                    if (!cards.length) return;
                    const edge = container.getBoundingClientRect().right;
                    let nearestIndex = 0;
                    let nearestDistance = Number.POSITIVE_INFINITY;
                    cards.forEach((card, index) => {
                      const distance = Math.abs(card.getBoundingClientRect().right - edge);
                      if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestIndex = index;
                      }
                    });
                    setActiveIndex((current) => current === nearestIndex ? current : nearestIndex);
                  }}
                  className="discount-carousel-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 transition-transform duration-500 ease-in-out touch-pan-x sm:gap-3"
                >
                  {products.map((product) => (
                    <div
                      data-discount-card
                      key={product.productCode}
                      className="w-[calc((100%-0.5rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2.25rem)/4)] lg:w-[calc((100%-2.25rem)/4)]"
                    >
                      <DiscountProductCard product={product} />
                    </div>
                  ))}
                </div>

                {products.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => scrollProducts(-1)}
                      disabled={activeIndex <= 0}
                      aria-label="محصول قبلی"
                      aria-disabled={activeIndex <= 0}
                      className="absolute right-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-700/70 bg-slate-950/90 text-2xl text-cyan-100 shadow-xl backdrop-blur-sm transition hover:scale-105 hover:border-cyan-400 hover:bg-cyan-900 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900/95 disabled:text-slate-600 disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:right-3 sm:h-11 sm:w-11"
                    >›</button>
                    <button
                      type="button"
                      onClick={() => scrollProducts(1)}
                      disabled={activeIndex >= products.length - 1}
                      aria-label="محصول بعدی"
                      aria-disabled={activeIndex >= products.length - 1}
                      className="absolute left-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-700/70 bg-slate-950/90 text-2xl text-cyan-100 shadow-xl backdrop-blur-sm transition hover:scale-105 hover:border-cyan-400 hover:bg-cyan-900 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900/95 disabled:text-slate-600 disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:left-3 sm:h-11 sm:w-11"
                    >‹</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiscountShowcase;
