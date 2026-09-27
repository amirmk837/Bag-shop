import { Link } from "react-router-dom";
import ImageNavigation from "./components/ImageNavigate";
import useImageViewer from "../functions/productfunc";
import ProductImage from "./components/ProductImage";
import ImageThumbnails from "../components/ImageThumbnails";
import ProductInfoes from "./components/ProductInfoes";
import CloseImage from "../components/CloseImage";

const ProductCard = ({ product }) => {
  const images = Array.isArray(product.url)
    ? product.url
    : product.url
      ? [product.url]
      : [];

  const {
    activeImage,
    isImageOpen,
    closeImage,
    nextImage,
    prevImage,
    handleThumbnailClick,
  } = useImageViewer(images);

  return (
    <>
      {/* ================================================= */}
      {/* Product Card */}
      {/* ================================================= */}

      <Link
        to={`/product/${product.id}`}
        className="
    group
    block
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
    duration-500
    hover:-translate-y-1
    hover:border-zinc-500
    hover:shadow-2xl
    sm:rounded-[24px]
    sm:p-2
    md:rounded-[28px]
  "
      >
        {/* ================================================= */}
        {/* تصویر */}
        {/* ================================================= */}

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
              {/* عکس اصلی */}
              <ProductImage
                image={images[activeImage]}
                title={product.title}
                id={product.id}
                onNext={nextImage}
                onPrev={prevImage}
              />

              {/* ================================================= */}
              {/* فلش‌ها */}
              {/* ================================================= */}

              {images.length > 1 && (
                <ImageNavigation
                  onPrev={prevImage}
                  onNext={nextImage}
                  position="card"
                />
              )}

              {/* ================================================= */}
              {/* شماره عکس */}
              {/* ================================================= */}

              {images.length > 1 && (
                <div
                  className="
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

              {/* ================================================= */}
              {/* Thumbnail */}
              {/* ================================================= */}

              <ImageThumbnails
                images={images}
                activeImage={activeImage}
                onSelect={handleThumbnailClick}
                position="bottom-2"
                w="w-10 sm:w-12 md:w-14"
                h="h-7 sm:h-8 md:h-9"
              />
            </>
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                px-2
                text-center
                text-xs
                text-zinc-500
                sm:text-sm
              "
            >
              تصویر موجود نیست
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* اطلاعات محصول */}
        {/* ================================================= */}

        <ProductInfoes product={product} />
      </Link>

      {/* ================================================= */}
      {/* Modal */}
      {/* ================================================= */}

      {isImageOpen && images.length > 0 && (
        <div
          onClick={closeImage}
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/90
            p-3
            backdrop-blur-sm
            sm:p-5
          "
        >
          <CloseImage onClick={closeImage} />

          <img
            src={images[activeImage]}
            alt={product.title || product.id}
            onClick={(e) => e.stopPropagation()}
            className="
              max-h-[85vh]
              max-w-[94vw]
              object-contain
              drop-shadow-2xl
              sm:max-h-[90vh]
              sm:max-w-[90vw]
            "
          />
        </div>
      )}
    </>
  );
};

export default ProductCard;
