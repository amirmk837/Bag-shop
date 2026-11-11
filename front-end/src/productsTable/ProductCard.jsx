import { useState } from "react";
import { Link } from "react-router-dom";
import ImageNavigation from "./components/ImageNavigate";
import ProductImage from "./components/ProductImage";
import ImageThumbnails from "../components/ImageThumbnails";
import ProductInfoes from "./components/ProductInfoes";

const ProductCard = ({ product, priority = false }) => {
  const images = Array.isArray(product.url)
    ? product.url.filter(Boolean)
    : product.url
      ? [product.url]
      : [];

  const [activeImage, setActiveImage] = useState(0);

  const nextImage = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (images.length <= 1) return;
    setActiveImage((current) => (current + 1) % images.length);
  };

  const prevImage = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (images.length <= 1) return;
    setActiveImage((current) => (current - 1 + images.length) % images.length);
  };

  const selectImage = (index) => setActiveImage(index);

  const productUrl = `/product/${product.productCode ?? product.id}`;

  return (
    <article
      dir="rtl"
      className="
        theme-product-card group relative isolate w-full min-w-0 overflow-hidden
        rounded-[24px] border border-cyan-950/50
        bg-gradient-to-br from-[#0e1a2f] via-[#0a1426] to-[#0e1121]
        p-1.5 text-center shadow-[0_12px_35px_rgba(0,0,0,0.25)]
        transition-all duration-500 ease-out
        hover:-translate-y-1.5 hover:border-cyan-500/35
        hover:shadow-[0_18px_45px_rgba(6,182,212,0.10)]
        sm:rounded-[28px] sm:p-2
      "
    >
      <div className="pointer-events-none absolute -right-16 -top-16 -z-10 h-40 w-40 rounded-full bg-cyan-600/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 -z-10 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <div
        className="
          theme-media-surface relative h-[180px] w-full overflow-hidden rounded-[19px]
          border border-white/[0.04]
          bg-gradient-to-br from-[#14253d] via-[#0e192c] to-[#080d19]
          sm:h-[210px] sm:rounded-[22px]
          md:h-[240px] lg:h-[260px]
        "
      >
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#060d19]/40 via-transparent to-white/[0.02]" />

        {images.length > 0 ? (
          <>
            <Link
              to={productUrl}
              aria-label={`مشاهده ${product.title || product.productCode || product.id}`}
              className="absolute inset-0 z-0 block h-full w-full"
            >
              <ProductImage
                image={images[activeImage]}
                title={product.title}
                id={product.productCode ?? product.id}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
              />
            </Link>

            {images.length > 1 && (
              <>
                <ImageNavigation
                  onPrev={prevImage}
                  onNext={nextImage}
                  position="card"
                />

                <div
                  className="
                  pointer-events-none absolute right-2 top-2 z-20
                  theme-dark-overlay rounded-full border border-white/[0.08]
                  bg-[#060d19]/80 px-2.5 py-1
                  text-[10px] font-semibold text-cyan-200
                  shadow-lg backdrop-blur-md sm:right-3 sm:top-3
                "
                >
                  {activeImage + 1} / {images.length}
                </div>

                <ImageThumbnails
                  images={images}
                  activeImage={activeImage}
                  onSelect={selectImage}
                  position="bottom-2"
                  w="w-10 sm:w-12 md:w-14"
                  h="h-7 sm:h-8 md:h-9"
                />
              </>
            )}
          </>
        ) : (
          <Link
            to={productUrl}
            className="
              flex h-full w-full items-center justify-center
              text-sm text-slate-500 transition-colors
              hover:text-cyan-400
            "
          >
            تصویر موجود نیست
          </Link>
        )}
      </div>

      <Link
        to={productUrl}
        className="
          relative block rounded-2xl outline-none
          focus-visible:ring-2 focus-visible:ring-cyan-500
          focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1a2f]
        "
      >
        <ProductInfoes product={product} />
      </Link>

      <div
        className="
        pointer-events-none absolute inset-x-8 bottom-0 h-px
        bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent
        opacity-0 transition-opacity duration-500
        group-hover:opacity-100
      "
      />
    </article>
  );
};

export default ProductCard;
