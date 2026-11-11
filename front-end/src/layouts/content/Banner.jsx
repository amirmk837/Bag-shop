import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSettings, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getActiveBanners } from "../../services/bannerApi";
import { useAuth } from "../../context/useAuth";

const FALLBACK_IMAGE = "/images/banners/banner.webp";
const SLIDE_INTERVAL = 5000;

const Banner = () => {
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    let ignore = false;

    const loadBanners = async () => {
      try {
        const data = await getActiveBanners();

        if (!ignore) {
          setBanners(Array.isArray(data) ? data : []);
          setActiveIndex(0);
          setPreviousIndex(null);
        }
      } catch (error) {
        console.error("Load active banners error:", error);

        if (!ignore) setBanners([]);
      }
    };

    loadBanners();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotion = () => setReducedMotion(motionQuery.matches);
    const updateVisibility = () => {
      setDocumentVisible(!document.hidden);
    };

    updateMotion();
    updateVisibility();

    motionQuery.addEventListener?.("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      motionQuery.removeEventListener?.("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (
      banners.length < 2 ||
      isHovered ||
      isFocused ||
      !documentVisible ||
      reducedMotion
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPreviousIndex(activeIndex);
      setActiveIndex((current) => (current + 1) % banners.length);
    }, SLIDE_INTERVAL);

    return () => window.clearTimeout(timer);
  }, [
    activeIndex,
    banners.length,
    isHovered,
    isFocused,
    documentVisible,
    reducedMotion,
  ]);

  useEffect(() => {
    if (banners.length < 2) return;

    const nextBanner = banners[(activeIndex + 1) % banners.length];
    const isMobile = window.matchMedia("(max-width: 639px)").matches;

    const nextImageUrl = isMobile
      ? nextBanner?.mobileImageUrl ||
        nextBanner?.desktopImageUrl ||
        nextBanner?.imageUrl
      : nextBanner?.desktopImageUrl || nextBanner?.imageUrl;

    if (!nextImageUrl) return;

    const image = new window.Image();
    image.decoding = "async";
    image.src = nextImageUrl;
  }, [activeIndex, banners]);

  const changeSlide = (nextIndex) => {
    if (banners.length < 2 || nextIndex === activeIndex) return;

    setPreviousIndex(activeIndex);
    setActiveIndex(nextIndex);
  };

  const showPrevious = () => {
    changeSlide((activeIndex - 1 + banners.length) % banners.length);
  };

  const showNext = () => {
    changeSlide((activeIndex + 1) % banners.length);
  };

  const handleImageError = (bannerId) => {
    setBanners((current) => current.filter((banner) => banner.id !== bannerId));

    setActiveIndex(0);
    setPreviousIndex(null);
  };

  const renderBannerImage = (banner, index) => {
    const isCurrent = index === activeIndex;
    const imageUrl = banner?.imageUrl || FALLBACK_IMAGE;

    const image = (
      <picture className="absolute inset-0 block h-full w-full">
        <source
          media="(max-width: 639px)"
          srcSet={banner?.mobileImageUrl || banner?.desktopImageUrl || imageUrl}
        />

        <img
          src={banner?.desktopImageUrl || imageUrl}
          alt={banner?.name || "بنر فروشگاه کاظمی"}
          decoding="async"
          loading={isCurrent ? "eager" : "lazy"}
          fetchPriority={isCurrent ? "high" : "auto"}
          onError={() => {
            if (banner) handleImageError(banner.id);
          }}
          className={`
            absolute inset-0 h-full w-full
            transition-transform duration-[7000ms] ease-out
            motion-reduce:!transform-none
            motion-reduce:transition-none
            ${isCurrent && !reducedMotion ? "scale-[1.055]" : "scale-100"}
          `}
          style={{
            objectFit: banner?.fit === "cover" ? "cover" : "contain",
            objectPosition: "center",
          }}
        />
      </picture>
    );

    if (banner?.linkUrl?.startsWith("/")) {
      return (
        <Link
          to={banner.linkUrl}
          aria-label={`مشاهده ${banner.name || "بنر"}`}
          tabIndex={isCurrent ? 0 : -1}
          className="absolute inset-0 block"
        >
          {image}
        </Link>
      );
    }

    if (banner?.linkUrl && /^https?:\/\//i.test(banner.linkUrl)) {
      return (
        <a
          href={banner.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`مشاهده ${banner.name || "بنر"}`}
          tabIndex={isCurrent ? 0 : -1}
          className="absolute inset-0 block"
        >
          {image}
        </a>
      );
    }

    return image;
  };

  const slides = banners.length > 0 ? banners : [null];

  return (
    <section
      className="relative isolate w-full overflow-hidden py-3 sm:py-5 lg:py-7"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsFocused(false);
        }
      }}
    >
      {/* Ambient background lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-cyan-500/[0.12] blur-[110px] sm:h-96 sm:w-96" />
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-violet-600/[0.13] blur-[110px] sm:h-96 sm:w-96" />
        <div className="absolute left-1/2 top-1/2 h-64 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.055] blur-[100px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-2 sm:px-4 lg:px-6">
        {/* Outer decorative frame */}
        <div
          className="
            relative rounded-[1.8rem] p-[1px]
            bg-gradient-to-br from-cyan-300/30
            via-white/[0.07] to-violet-400/25
            shadow-[0_25px_90px_rgba(0,0,0,.38)]
            sm:rounded-[2.3rem]
          "
        >
          <div
            dir="ltr"
            role="region"
            aria-roledescription="carousel"
            aria-label="بنرهای فروشگاه کاظمی"
            className="
              group relative aspect-[16/10] w-full
              overflow-hidden rounded-[1.75rem]
              bg-[#0b1422]
              sm:aspect-[16/7] sm:rounded-[2.2rem]
              lg:aspect-[16/6] lg:rounded-[2.2rem]
            "
          >
            {/* Background texture */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute inset-0 z-[2]
                bg-[linear-gradient(135deg,rgba(8,20,35,.12),transparent_45%,rgba(8,20,35,.18))]
              "
            />

            {/* Image contrast and depth */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute inset-0 z-[3]
                bg-gradient-to-t from-[#06101d]/25
                via-transparent to-[#071522]/10
              "
            />

            {/* Slides */}
            {slides.map((banner, index) => {
              const isCurrent = index === activeIndex;
              const isPrevious = index === previousIndex;

              if (!isCurrent && !isPrevious) return null;

              return (
                <div
                  key={banner?.id ?? "fallback-banner"}
                  onTransitionEnd={(event) => {
                    if (event.target === event.currentTarget && isPrevious) {
                      setPreviousIndex(null);
                    }
                  }}
                  aria-hidden={!isCurrent}
                  className={`
                    absolute inset-0
                    transition-opacity duration-1000 ease-in-out
                    motion-reduce:transition-none
                    ${
                      isCurrent
                        ? "z-[1] opacity-100"
                        : "pointer-events-none z-0 opacity-0"
                    }
                  `}
                >
                  {renderBannerImage(banner, index)}
                </div>
              );
            })}

            {/* Top accent line */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute inset-x-[8%] top-0 z-20
                h-px bg-gradient-to-r from-transparent
                via-white/35 to-transparent
              "
            />

            {/* Inner border */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute inset-0 z-20
                rounded-[inherit] border border-white/[0.12]
                shadow-[inset_0_1px_0_rgba(255,255,255,.12),inset_0_-25px_60px_rgba(0,0,0,.08)]
              "
            />

            {/* Admin button */}
            {user?.role === "ADMIN" && (
              <Link
                to="/admin/banners"
                aria-label="مدیریت بنرها"
                title="مدیریت بنرها"
                className="
                  absolute right-4 top-4 z-30
                  flex h-11 w-11 items-center justify-center
                  rounded-2xl border border-white/20
                  bg-[#071522]/65 text-white
                  shadow-[0_8px_25px_rgba(0,0,0,.25)]
                  backdrop-blur-xl
                  transition-all duration-300
                  hover:rotate-90 hover:scale-105
                  hover:border-cyan-300/60
                  hover:bg-cyan-400/20 hover:text-cyan-100
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-cyan-300
                  sm:right-6 sm:top-6 sm:h-12 sm:w-12
                "
              >
                <FiSettings size={19} aria-hidden="true" />
              </Link>
            )}

            {/* Navigation buttons */}
            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="بنر قبلی"
                  className="
                    absolute right-3 top-1/2 z-30
                    flex h-10 w-10 -translate-y-1/2
                    items-center justify-center rounded-xl
                    border border-white/20
                    bg-[#071522]/55 text-white
                    shadow-[0_8px_25px_rgba(0,0,0,.25)]
                    backdrop-blur-xl
                    transition-all duration-300
                    hover:scale-110 hover:border-cyan-300/60
                    hover:bg-cyan-400/20 hover:text-cyan-100
                    active:scale-95
                    focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-cyan-300
                    sm:right-6 sm:h-12 sm:w-12 sm:rounded-2xl
                  "
                >
                  <FiChevronRight size={23} />
                </button>

                <button
                  type="button"
                  onClick={showNext}
                  aria-label="بنر بعدی"
                  className="
                    absolute left-3 top-1/2 z-30
                    flex h-10 w-10 -translate-y-1/2
                    items-center justify-center rounded-xl
                    border border-white/20
                    bg-[#071522]/55 text-white
                    shadow-[0_8px_25px_rgba(0,0,0,.25)]
                    backdrop-blur-xl
                    transition-all duration-300
                    hover:scale-110 hover:border-cyan-300/60
                    hover:bg-cyan-400/20 hover:text-cyan-100
                    active:scale-95
                    focus-visible:outline-2
                    focus-visible:outline-offset-2
                    focus-visible:outline-cyan-300
                    sm:left-6 sm:h-12 sm:w-12 sm:rounded-2xl
                  "
                >
                  <FiChevronLeft size={23} />
                </button>

                {/* Slide indicators */}
                <div
                  dir="ltr"
                  className="
                    absolute bottom-4 left-1/2 z-30
                    flex -translate-x-1/2 items-center gap-2
                    rounded-full border border-white/[0.16]
                    bg-[#071522]/65 px-3 py-2.5
                    shadow-[0_8px_30px_rgba(0,0,0,.3)]
                    backdrop-blur-2xl
                    sm:bottom-6 sm:gap-2.5 sm:px-4 sm:py-3
                  "
                >
                  {banners.map((banner, index) => (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={() => changeSlide(index)}
                      aria-label={`رفتن به بنر ${index + 1}`}
                      aria-current={index === activeIndex ? "true" : undefined}
                      className={`
                        relative h-2 rounded-full
                        transition-all duration-500
                        focus-visible:outline-2
                        focus-visible:outline-offset-4
                        focus-visible:outline-cyan-300
                        ${
                          index === activeIndex
                            ? "w-8 bg-gradient-to-r from-cyan-300 to-blue-400 shadow-[0_0_15px_rgba(103,232,249,.65)] sm:w-10"
                            : "w-2 bg-white/45 hover:w-5 hover:bg-white/90"
                        }
                      `}
                    />
                  ))}
                </div>

                {/* Slide counter */}
                <div
                  dir="ltr"
                  aria-live="polite"
                  className="
                    absolute bottom-4 right-4 z-30
                    flex items-center gap-1.5
                    rounded-full border border-white/15
                    bg-[#071522]/60 px-3 py-2
                    text-[11px] font-semibold tracking-[0.12em]
                    text-white/90 shadow-lg backdrop-blur-xl
                    sm:bottom-6 sm:right-6 sm:px-3.5 sm:py-2.5
                    sm:text-xs
                  "
                >
                  <span className="text-cyan-300">
                    {String(activeIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="text-white/35">/</span>
                  <span className="text-white/60">
                    {String(banners.length).padStart(2, "0")}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
