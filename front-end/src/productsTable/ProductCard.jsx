import { useState } from "react";
import { Link } from "react-router-dom";
import ImageNavigation from "./components/ImageNavigate";
import ProductImage from "./components/ProductImage";
import ImageThumbnails from "../components/ImageThumbnails";
import ProductInfoes from "../productsTable/components/ProductInfoes";

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

  const selectImage = (index) => {
    setActiveImage(index);
  };

  return (
    <article
      className="
        group
        w-full
        min-w-0
        overflow-hidden
        rounded-2xl
        border
        border-zinc-700/60
        bg-zinc-900
        p-1.5
        text-center
        shadow-xl
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-zinc-500
        hover:shadow-2xl
        sm:rounded-[24px]
        sm:p-2
        md:rounded-[28px]
      "
      dir="rtl"
    >
      {/* تصاویر محصول */}
      <div
        className="
          relative
          h-[180px]
          w-full
          overflow-hidden
          rounded-[16px]
          bg-gradient-to-br
          from-zinc-800
          via-zinc-900
          to-black
          sm:h-[210px]
          sm:rounded-[20px]
          md:h-[240px]
          lg:h-[260px]
          lg:rounded-[22px]
        "
      >
        {images.length > 0 ? (
          <>
            {/* کلیک روی تصویر، وارد صفحه جزئیات می‌شود */}
            <Link
              to={`/product/${product.productCode ?? product.id}`}
              aria-label={`مشاهده ${product.title || product.productCode || product.id}`}
              className="absolute inset-0 z-0 block h-full w-full"
            >
              <ProductImage
                image={images[activeImage]}
                title={product.title}
                id={product.productCode ?? product.id}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                onNext={nextImage}
                onPrev={prevImage}
              />
            </Link>

            {/* دکمه‌های جابه‌جایی تصویر */}
            {images.length > 1 && (
              <ImageNavigation
                onPrev={prevImage}
                onNext={nextImage}
                position="card"
              />
            )}

            {/* شماره تصویر */}
            {images.length > 1 && (
              <div
                className="
                  pointer-events-none
                  absolute
                  right-2
                  top-2
                  z-20
                  rounded-full
                  bg-black/60
                  px-2
                  py-1
                  text-[9px]
                  font-semibold
                  text-white
                  backdrop-blur
                  sm:right-3
                  sm:top-3
                  sm:px-2.5
                  sm:text-[10px]
                "
              >
                {activeImage + 1} / {images.length}
              </div>
            )}

            {/* انتخاب تصویر بندانگشتی؛ بدون باز شدن مودال */}
            <ImageThumbnails
              images={images}
              activeImage={activeImage}
              onSelect={selectImage}
              position="bottom-2"
              w="w-10 sm:w-12 md:w-14"
              h="h-7 sm:h-8 md:h-9"
            />
          </>
        ) : (
          <Link
            to={`/product/${product.productCode ?? product.id}`}
            className="
              flex
              h-full
              w-full
              items-center
              justify-center
              px-2
              text-xs
              text-zinc-500
              sm:text-sm
            "
          >
            تصویر موجود نیست
          </Link>
        )}
      </div>

      {/* اطلاعات محصول و لینک ورود به جزئیات */}
      <Link
        to={`/product/${product.productCode ?? product.id}`}
        className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ProductInfoes product={product} />
      </Link>
    </article>
  );
};

export default ProductCard;
