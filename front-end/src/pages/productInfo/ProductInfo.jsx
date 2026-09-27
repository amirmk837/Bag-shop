import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useImageViewer from "../../functions/productfunc";
import ImageThumbnails from "../../components/ImageThumbnails";
import ProductImage from "../../productsTable/components/ProductImage";
import ProductDetails from "./ProductsDetail";
import { getProductByCode } from "../../services/api";

const ProductInfoes = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =================================================
  // دریافت محصول از API
  // =================================================

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProductByCode(id);

        if (!data) {
          setProduct(null);
          setError("محصول پیدا نشد");
          return;
        }

        setProduct(data);
      } catch (error) {
        console.error("Product detail error:", error);

        setProduct(null);
        setError("خطا در دریافت محصول");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // =================================================
  // تصاویر
  // Hook باید همیشه اجرا شود
  // =================================================

  const images = Array.isArray(product?.url)
    ? product.url
    : product?.url
      ? [product.url]
      : [];

  const { activeImage, nextImage, prevImage, handleThumbnailClick } =
    useImageViewer(images);

  // =================================================
  // Loading
  // =================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <p className="text-xl text-zinc-400">در حال دریافت محصول...</p>
      </div>
    );
  }

  // =================================================
  // Error
  // =================================================

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <p className="text-center text-xl text-zinc-400">
          {error || "محصول پیدا نشد"}
        </p>
      </div>
    );
  }

  // =================================================
  // Render
  // =================================================

  return (
    <div
      className="
        min-h-screen
        bg-zinc-950
        px-3
        py-6
        text-white
        sm:px-6
        sm:py-10
      "
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
            shadow-2xl
            sm:rounded-[32px]
          "
        >
          <div className="grid md:grid-cols-2">
            {/* ================================================= */}
            {/* تصویر */}
            {/* ================================================= */}

            <div
              className="
                relative
                flex
                min-h-[380px]
                flex-col
                items-center
                justify-center
                overflow-hidden
                bg-gradient-to-br
                from-zinc-900
                via-zinc-800
                to-black
                p-5
                sm:min-h-[500px]
                sm:p-8
                md:min-h-[550px]
                md:p-10
              "
            >
              <div
                className="
                  absolute
                  h-52
                  w-52
                  rounded-full
                  bg-white/5
                  blur-3xl
                  sm:h-80
                  sm:w-80
                "
              />

              {images.length > 0 ? (
                <>
                  <ProductImage
                    image={images[activeImage]}
                    title={product.title}
                    id={product.id}
                    onNext={nextImage}
                    onPrev={prevImage}
                  />

                  <ImageThumbnails
                    images={images}
                    activeImage={activeImage}
                    onSelect={handleThumbnailClick}
                    position="bottom-3 sm:bottom-5 md:bottom-8"
                    w="w-14 sm:w-16 md:w-20"
                    h="h-10 sm:h-12 md:h-14"
                  />
                </>
              ) : (
                <span className="text-zinc-500">تصویر موجود نیست</span>
              )}
            </div>

            {/* ================================================= */}
            {/* اطلاعات محصول */}
            {/* ================================================= */}

            <ProductDetails product={product} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfoes;
