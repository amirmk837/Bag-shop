import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getPopularProducts } from "../../services/api";

const format = (value) => Number(value || 0).toLocaleString("fa-IR");

const PopularShowcase = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canGoPrevious, setCanGoPrevious] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const scrollerRef = useRef(null);
  const targetIndexRef = useRef(0);
  const programmaticScrollRef = useRef(false);
  const scrollEndTimerRef = useRef(null);

  useEffect(() => {
    let active = true;

    getPopularProducts({ days: 30 })
      .then((result) => {
        if (active) {
          setProducts((result.products || []).slice(0, 10));
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.message || "دریافت محبوب‌ترین محصولات ناموفق بود.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotionPreference = () => {
      setReducedMotion(motionQuery.matches);
    };

    updateMotionPreference();
    motionQuery.addEventListener?.("change", updateMotionPreference);

    return () => {
      motionQuery.removeEventListener?.("change", updateMotionPreference);
    };
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollerRef.current;
    if (!container) return;

    const cards = Array.from(container.querySelectorAll("[data-popular-card]"));

    if (!cards.length) {
      setCanGoPrevious(false);
      setCanGoNext(false);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const tolerance = 2;

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.right - containerRect.right);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const firstRect = cards[0].getBoundingClientRect();
    const lastRect = cards[cards.length - 1].getBoundingClientRect();

    // اولین محصول باید کاملاً داخل محدوده نمایش باشد.
    const firstFullyVisible =
      firstRect.left >= containerRect.left - tolerance &&
      firstRect.right <= containerRect.right + tolerance;

    // آخرین محصول باید کاملاً داخل محدوده نمایش باشد.
    const lastFullyVisible =
      lastRect.left >= containerRect.left - tolerance &&
      lastRect.right <= containerRect.right + tolerance;

    setCanGoPrevious(!firstFullyVisible);
    setCanGoNext(!lastFullyVisible);

    if (!programmaticScrollRef.current) {
      targetIndexRef.current = nearestIndex;
    }
  }, []);

  const finishProgrammaticScroll = useCallback(() => {
    programmaticScrollRef.current = false;

    if (scrollEndTimerRef.current) {
      window.clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }

    handleScroll();
  }, [handleScroll]);

  const move = useCallback(
    (direction) => {
      const container = scrollerRef.current;
      if (!container) return;

      const cards = Array.from(
        container.querySelectorAll("[data-popular-card]"),
      );

      if (cards.length <= 1) return;

      const containerRect = container.getBoundingClientRect();

      let nearestIndex = 0;
      let nearestDistance = Infinity;

      cards.forEach((card, index) => {
        const distance = Math.abs(
          card.getBoundingClientRect().right - containerRect.right,
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      // در زمان انیمیشن، مقصد قبلی مبنای کلیک بعدی است.
      const baseIndex = programmaticScrollRef.current
        ? targetIndexRef.current
        : nearestIndex;

      const nextIndex = Math.max(
        0,
        Math.min(baseIndex + direction, cards.length - 1),
      );

      if (nextIndex === baseIndex) return;

      const targetRect = cards[nextIndex].getBoundingClientRect();
      const distance = targetRect.right - containerRect.right;

      targetIndexRef.current = nextIndex;
      programmaticScrollRef.current = true;

      if (scrollEndTimerRef.current) {
        window.clearTimeout(scrollEndTimerRef.current);
      }

      container.scrollBy({
        left: distance,
        behavior: reducedMotion ? "auto" : "smooth",
      });

      scrollEndTimerRef.current = window.setTimeout(
        finishProgrammaticScroll,
        1200,
      );
    },
    [finishProgrammaticScroll, reducedMotion],
  );

  useEffect(() => {
    const container = scrollerRef.current;
    if (!container) return;

    container.addEventListener("scrollend", finishProgrammaticScroll);

    return () => {
      container.removeEventListener("scrollend", finishProgrammaticScroll);

      if (scrollEndTimerRef.current) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, [finishProgrammaticScroll]);

  useEffect(() => {
    const container = scrollerRef.current;
    if (!container) return;

    handleScroll();

    const observer = new ResizeObserver(() => {
      handleScroll();
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [products, handleScroll]);

  if (!loading && !error && products.length === 0) {
    return null;
  }

  return (
    <section
      id="popular-products"
      dir="rtl"
      className="mx-auto my-10 w-full max-w-[1600px] px-3 sm:my-14 sm:px-5"
    >
      <div className="theme-feature-panel relative isolate overflow-hidden rounded-[1.5rem] border border-cyan-300/15 bg-[#0d1723] p-3 shadow-[0_20px_60px_rgba(0,0,0,.28)] sm:rounded-[1.8rem] sm:p-5 lg:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_8%_0%,rgba(34,211,238,.12),transparent_36%),radial-gradient(ellipse_at_100%_100%,rgba(139,92,246,.10),transparent_38%)]"
        />

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-[.18em] text-cyan-200 sm:text-[11px]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-200/20 bg-cyan-200/[.08] text-sm">
                ↗
              </span>
              · 30 DAYS
            </div>

            <h2 className="text-xl font-black text-white sm:text-2xl lg:text-[1.7rem]">
              محبوب‌ترین محصولات
            </h2>

            <p className="mt-1 text-xs leading-6 text-slate-400 sm:text-sm">
              محصولاتی که در یک ماه اخیر بیشتر دیده شده‌اند.
            </p>
          </div>

          <span className="rounded-full border border-cyan-200/15 bg-cyan-200/[.06] px-3 py-1.5 text-[10px] font-bold text-cyan-100 sm:text-xs">
            بر اساس بازدید واقعی
          </span>
        </div>

        {loading ? (
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
            aria-label="در حال بارگذاری محبوب‌ترین محصولات"
          >
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-white/[.06] bg-white/[.035]"
              >
                <div className="aspect-[4/3] bg-white/[.07]" />

                <div className="space-y-2 p-3">
                  <div className="h-3 rounded bg-white/[.08]" />
                  <div className="h-3 w-2/3 rounded bg-white/[.06]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p
            role="status"
            className="rounded-xl border border-red-400/15 bg-red-400/[.06] p-5 text-sm text-red-200"
          >
            محبوب‌ترین محصولات در حال حاضر بارگذاری نشدند.
          </p>
        ) : (
          <div
            className="relative"
            role="region"
            aria-roledescription="carousel"
            aria-label="محبوب‌ترین محصولات"
          >
            <div
              ref={scrollerRef}
              dir="rtl"
              onScroll={handleScroll}
              className="popular-carousel-scrollbar flex snap-x snap-mandatory gap-2 overflow-hidden overscroll-x-contain pb-2 touch-pan-x sm:gap-3"
            >
              {products.map((product, index) => {
                const original = Number(product.price);
                const discounted = Number(product.discountedPrice);

                const hasDiscount =
                  Number.isSafeInteger(discounted) &&
                  discounted > 0 &&
                  discounted < original;

                return (
                  <Link
                    data-popular-card
                    key={product.productCode}
                    to={`/product/${product.productCode}`}
                    className="theme-product-card group relative w-[calc((100%-0.5rem)/2)] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/[.08] bg-[#121f2d] p-2 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/35 hover:bg-[#17283a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:w-[calc((100%-2.25rem)/4)] sm:rounded-[1.35rem] sm:p-2.5"
                  >
                    <div className="theme-media-surface relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-white/[.05] bg-[radial-gradient(ellipse_at_50%_45%,rgba(255,255,255,.08),transparent_68%),linear-gradient(145deg,#1c2b3c,#0a111b)] p-3">
                      {product.url?.[0] ? (
                        <img
                          src={product.url[0]}
                          alt={product.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,.35)] transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-xs text-slate-500">
                          تصویر موجود نیست
                        </span>
                      )}

                      <span className="theme-dark-overlay absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-lg border border-amber-200/25 bg-[#101923]/90 px-2 text-xs font-black text-amber-200">
                        {(index + 1).toLocaleString("fa-IR")}
                      </span>
                    </div>

                    <div className="px-1 pb-1 pt-3">
                      <h3 className="line-clamp-2 min-h-10 text-xs font-extrabold leading-5 text-slate-100 transition-colors group-hover:text-cyan-100 sm:text-sm">
                        {product.title}
                      </h3>

                      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-1">
                        <span className="text-[10px] text-slate-500">قیمت</span>

                        <span className="text-xs font-black text-white sm:text-sm">
                          {format(hasDiscount ? discounted : original)}{" "}
                          <small className="text-[9px] font-semibold text-slate-400">
                            تومان
                          </small>
                        </span>
                      </div>

                      {hasDiscount && (
                        <p className="mt-1 text-left text-[10px] text-slate-500 line-through">
                          {format(original)} تومان
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {products.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="محصول محبوب قبلی"
                  onClick={() => move(-1)}
                  disabled={!canGoPrevious}
                  className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-100/20 bg-[#07121d]/90 text-xl text-cyan-100 shadow-xl backdrop-blur transition hover:scale-105 hover:border-cyan-200/50 hover:bg-[#183044] disabled:cursor-not-allowed disabled:opacity-40 sm:right-2 sm:h-10 sm:w-10"
                >
                  ‹
                </button>

                <button
                  type="button"
                  aria-label="محصول محبوب بعدی"
                  onClick={() => move(1)}
                  disabled={!canGoNext}
                  className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-100/20 bg-[#07121d]/90 text-xl text-cyan-100 shadow-xl backdrop-blur transition hover:scale-105 hover:border-cyan-200/50 hover:bg-[#183044] disabled:cursor-not-allowed disabled:opacity-40 sm:left-2 sm:h-10 sm:w-10"
                >
                  ›
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularShowcase;
