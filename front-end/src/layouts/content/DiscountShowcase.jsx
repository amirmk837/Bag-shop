import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getProductsPage } from "../../services/api";
import DiscountProductCard from "../../components/DiscountProductCard";
import { useAuth } from "../../context/useAuth";

const DiscountShowcase = () => {
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
          const validProducts = (result.products || [])
            .filter((product) => {
              const original = Number(product.price);
              const final = Number(product.discountedPrice);

              return (
                Number.isSafeInteger(original) &&
                Number.isSafeInteger(final) &&
                original > 0 &&
                final > 0 &&
                final < original
              );
            })
            .slice(0, 10);

          setProducts(validProducts);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "دریافت پیشنهادهای ویژه ناموفق بود.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDiscounts();

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

    const cards = Array.from(
      container.querySelectorAll("[data-discount-card]"),
    );

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

    const firstFullyVisible =
      firstRect.left >= containerRect.left - tolerance &&
      firstRect.right <= containerRect.right + tolerance;

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

  const scrollProducts = useCallback(
    (direction) => {
      const container = scrollerRef.current;
      if (!container) return;

      const cards = Array.from(
        container.querySelectorAll("[data-discount-card]"),
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

  return (
    <section
      dir="rtl"
      className="mx-auto my-10 w-full max-w-[1600px] px-3 sm:my-14 sm:px-5"
    >
      <div className="relative overflow-hidden rounded-[1.5rem] border border-cyan-800/60 bg-gradient-to-br from-[#0c202b] via-[#081a24] to-[#101b2b] p-3 shadow-[0_18px_55px_rgba(0,0,0,.38),inset_0_1px_0_rgba(255,255,255,.05)] sm:rounded-[1.8rem] sm:p-5 lg:p-6">
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
            مدیریت تخفیف‌ها
            <span aria-hidden="true">⚙</span>
          </Link>
        )}

        <div className="relative">
          <div className="relative mb-5 overflow-hidden rounded-2xl border border-cyan-800/50 bg-slate-950/45 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] sm:mb-6 sm:px-6 sm:py-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"
            />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/20 to-blue-500/10 text-2xl font-black text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,.12)] sm:h-14 sm:w-14 sm:text-3xl">
                  ٪
                </div>

                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-white sm:text-2xl">
                      پیشنهادهای ویژه
                    </h2>

                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-200 sm:text-xs">
                      تخفیف ویژه
                    </span>
                  </div>

                  <p className="text-xs font-bold leading-6 text-cyan-100/90 sm:text-sm">
                    محصولات منتخب با تخفیف‌های جذاب
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-400 sm:text-xs">
                    فرصت خرید با قیمت کمتر را از دست ندهید.
                  </p>
                </div>
              </div>

              <Link
                to="/discounts"
                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-cyan-700/60 bg-cyan-950/60 px-4 py-2.5 text-xs font-black text-cyan-100 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-cyan-800/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                مشاهده همه تخفیف‌ها
                <span aria-hidden="true">‹</span>
              </Link>
            </div>
          </div>

          {loading ? (
            <div
              className="flex gap-2 overflow-hidden sm:gap-3"
              aria-label="در حال بارگذاری محصولات تخفیف‌دار"
            >
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
            <p
              role="status"
              className="rounded-xl border border-rose-900/60 bg-slate-950/80 p-5 text-sm font-bold text-rose-200"
            >
              پیشنهادهای ویژه در حال حاضر بارگذاری نشدند.
            </p>
          ) : products.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-cyan-900/60 bg-slate-950/65 p-6 text-center text-slate-200">
              <span className="text-4xl font-black text-cyan-300">٪</span>

              <p className="mt-2 font-black">
                فعلاً پیشنهاد تخفیف‌داری نداریم.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                با ثبت تخفیف معتبر، محصولات اینجا نمایش داده می‌شوند.
              </p>
            </div>
          ) : (
            <div
              className="relative min-w-0"
              role="region"
              aria-roledescription="carousel"
              aria-label="محصولات تخفیف‌دار"
            >
              <div
                ref={scrollerRef}
                dir="rtl"
                onScroll={handleScroll}
                className="discount-carousel-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 touch-pan-x sm:gap-3"
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
                    disabled={!canGoPrevious}
                    aria-label="محصول قبلی"
                    className="absolute right-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-700/70 bg-slate-950/90 text-2xl text-cyan-100 shadow-xl backdrop-blur-sm transition hover:scale-105 hover:border-cyan-400 hover:bg-cyan-900 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900/95 disabled:text-slate-600 disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:right-3 sm:h-11 sm:w-11"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollProducts(1)}
                    disabled={!canGoNext}
                    aria-label="محصول بعدی"
                    className="absolute left-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-700/70 bg-slate-950/90 text-2xl text-cyan-100 shadow-xl backdrop-blur-sm transition hover:scale-105 hover:border-cyan-400 hover:bg-cyan-900 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900/95 disabled:text-slate-600 disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 sm:left-3 sm:h-11 sm:w-11"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DiscountShowcase;
