import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSettings } from "react-icons/fi";
import { getActiveBanners } from "../../services/bannerApi";
import { useAuth } from "../../context/AuthContext";

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


  // دریافت بنرهای فعال
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

        if (!ignore) {
          setBanners([]);
        }
      }
    };

    loadBanners();

    return () => {
      ignore = true;
    };
  }, []);

  // توقف چرخش خودکار هنگام تعامل کاربر، مخفی بودن تب یا فعال بودن کاهش حرکت.
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

  // تعویض خودکار هر ۵ ثانیه؛ در زمان تعامل یا عدم مشاهده صفحه متوقف می‌شود.
  // پس از جابه‌جایی دستی، تایمر از نو شروع می‌شود.
  useEffect(() => {
    if (
      banners.length < 2 ||
      isHovered ||
      isFocused ||
      !documentVisible ||
      reducedMotion
    ) return;

    const timer = window.setTimeout(() => {
      setPreviousIndex(activeIndex);
      setActiveIndex((current) => (current + 1) % banners.length);
    }, SLIDE_INTERVAL);

    return () => window.clearTimeout(timer);
  }, [activeIndex, banners.length, isHovered, isFocused, documentVisible, reducedMotion]);

  // فقط تصویر اسلاید بعدی را پیش‌بارگذاری می‌کنیم؛ نه تمام اسلایدها را.
  useEffect(() => {
    if (banners.length < 2) return;

    const nextBanner = banners[(activeIndex + 1) % banners.length];
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    const nextImageUrl = isMobile
      ? nextBanner?.mobileImageUrl || nextBanner?.desktopImageUrl || nextBanner?.imageUrl
      : nextBanner?.desktopImageUrl || nextBanner?.imageUrl;

    if (!nextImageUrl) return;

    const image = new window.Image();
    image.decoding = "async";
    image.src = nextImageUrl;
  }, [activeIndex, banners]);

  const showPrevious = () => {
    if (banners.length < 2) return;

    setPreviousIndex(activeIndex);
    setActiveIndex(
      (current) => (current - 1 + banners.length) % banners.length,
    );
  };

  const showNext = () => {
    if (banners.length < 2) return;

    setPreviousIndex(activeIndex);
    setActiveIndex((current) => (current + 1) % banners.length);
  };

  const handleImageError = (bannerId) => {
    setPreviousIndex(null);
    setBanners((current) => current.filter((banner) => banner.id !== bannerId));
    setActiveIndex(0);
  };

  const renderBannerImage = (banner, index) => {
    const isCurrent = index === activeIndex;
    const imageUrl = banner?.imageUrl || FALLBACK_IMAGE;

    const image = (
      <picture className="absolute inset-0 block h-full w-full">
        <source
          media="(max-width: 639px)"
          srcSet={banner?.mobileImageUrl || imageUrl}
        />

        <img
          src={banner?.desktopImageUrl || imageUrl}
          alt={banner?.name || "بنر فروشگاه کاظمی"}
          decoding="async"
          onError={() => {
            if (banner) handleImageError(banner.id);
          }}
          className="absolute inset-0 block h-full w-full"
          style={{
            objectFit: banner?.fit === "cover" ? "cover" : "contain",
            objectPosition: "center",
          }}
          loading={isCurrent ? "eager" : "lazy"}
          fetchPriority={isCurrent ? "high" : "auto"}
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

    if (banner?.linkUrl) {
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
      className="w-full px-3 sm:px-5 md:px-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsFocused(false);
        }
      }}
    >
      <div
        dir="ltr"
        role="region"
        aria-roledescription="carousel"
        aria-label="بنرهای فروشگاه کاظمی"
        className="
          relative mx-auto
          aspect-[16/9] w-full overflow-hidden
          rounded-2xl bg-zinc-950
          sm:aspect-[3/1] sm:rounded-3xl
          lg:aspect-[4/1] lg:rounded-4xl
        "
      >
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
                transition-opacity duration-1000 ease-in-out will-change-[opacity]
                motion-reduce:transition-none
                ${
                  isCurrent
                    ? "z-10 opacity-100"
                    : "pointer-events-none z-0 opacity-0"
                }
              `}
            >
              {renderBannerImage(banner, index)}
            </div>
          );
        })}

        {/* دکمه تنظیمات؛ فقط برای مدیر */}
        {user?.role === "ADMIN" && (
          <Link
            to="/admin/banners"
            aria-label="مدیریت بنرها"
            title="مدیریت بنرها"
            className="
              absolute right-3 top-3 z-30
              flex h-10 w-10 items-center justify-center
              rounded-full border border-white/20
              bg-black/60 text-white shadow-lg
              backdrop-blur-sm transition
              hover:bg-black/85
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-white
            "
          >
            <FiSettings size={21} aria-hidden="true" />
          </Link>
        )}

        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="بنر قبلی"
              className="
                absolute right-3 top-1/2 z-20
                flex h-10 w-10 -translate-y-1/2
                items-center justify-center
                rounded-full border border-white/20
                bg-black/45 text-2xl text-white
                backdrop-blur-sm transition hover:bg-black/70
                sm:h-11 sm:w-11
              "
            >
              ‹
            </button>

            <button
              type="button"
              onClick={showNext}
              aria-label="بنر بعدی"
              className="
                absolute left-3 top-1/2 z-20
                flex h-10 w-10 -translate-y-1/2
                items-center justify-center
                rounded-full border border-white/20
                bg-black/45 text-2xl text-white
                backdrop-blur-sm transition hover:bg-black/70
                sm:h-11 sm:w-11
              "
            >
              ›
            </button>

            <div
              dir="ltr"
              className="
                absolute bottom-3 left-1/2 z-20
                flex -translate-x-1/2 items-center gap-2
                rounded-full bg-black/35 px-3 py-2
                backdrop-blur-sm
              "
            >
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => {
                    setPreviousIndex(activeIndex);
                    setActiveIndex(index);
                  }}
                  aria-label={`رفتن به بنر ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  className={`
                    h-2 rounded-full transition-all duration-300
                    ${
                      index === activeIndex
                        ? "w-6 bg-white"
                        : "w-2 bg-white/50 hover:bg-white/80"
                    }
                  `}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Banner;
