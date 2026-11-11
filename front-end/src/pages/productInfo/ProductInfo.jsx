import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ImageThumbnails from "../../components/ImageThumbnails";
import ProductImage from "../../productsTable/components/ProductImage";
import ProductDetails from "./ProductsDetail";
import { getProductByCode } from "../../services/api";
import BackPage from "../../components/BackPage";
import ProductComments from "../../components/ProductComments";

const ProductInfoes = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setActiveImage(0);

        const data = await getProductByCode(id);

        if (cancelled) return;

        if (!data) {
          setError("محصول پیدا نشد");
          return;
        }

        setProduct(data);
      } catch (error) {
        if (cancelled) return;

        console.error("Product detail error:", error);
        setError("خطا در دریافت محصول");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id, retryKey]);

  const images = Array.isArray(product?.url)
    ? product.url.filter(Boolean)
    : product?.url
      ? [product.url]
      : [];

  const nextImage = () => {
    if (images.length <= 1) return;

    setActiveImage((current) => (current + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length <= 1) return;

    setActiveImage((current) => (current - 1 + images.length) % images.length);
  };

  const selectImage = (index) => {
    setActiveImage(index);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <p className="text-xl text-zinc-400">در حال دریافت محصول...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-xl text-zinc-400">{error || "محصول پیدا نشد"}</p>
          {error && error !== "محصول پیدا نشد" && (
            <button
              type="button"
              onClick={() => setRetryKey((current) => current + 1)}
              className="rounded-xl border border-zinc-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              تلاش دوباره
            </button>
          )}
          <BackPage fallback="/" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-zinc-950 px-3 py-6 text-white sm:px-6 sm:py-10"
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-4"><BackPage fallback="/" /></div>
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl sm:rounded-[32px]">
          <div className="grid md:grid-cols-2">
            {/* گالری تصاویر */}
            <div
              className="
                relative flex min-h-[380px] flex-col
                items-center justify-center overflow-hidden
                bg-gradient-to-br from-zinc-900 via-zinc-800 to-black
                p-5 sm:min-h-[500px] sm:p-8
                md:min-h-[550px] md:p-10
              "
            >
              <div className="pointer-events-none absolute h-52 w-52 rounded-full bg-white/5 blur-3xl sm:h-80 sm:w-80" />

              {images.length > 0 ? (
                <>
                  <ProductImage
                    image={images[activeImage]}
                    title={product.title}
                    id={product.productCode ?? product.id}
                    loading="eager"
                    fetchPriority="high"
                    onNext={nextImage}
                    onPrev={prevImage}
                  />

                  <ImageThumbnails
                    images={images}
                    activeImage={activeImage}
                    onSelect={selectImage}
                    position="bottom-3 sm:bottom-5 md:bottom-8"
                    w="w-14 sm:w-16 md:w-20"
                    h="h-10 sm:h-12 md:h-14"
                  />
                </>
              ) : (
                <span className="relative text-zinc-500">تصویر موجود نیست</span>
              )}
            </div>

            {/* اطلاعات محصول */}
            <ProductDetails product={product} />
          </div>
        </div>
        <ProductComments key={product.productCode ?? product.id} productCode={product.productCode ?? product.id} />
      </div>
    </div>
  );
};

export default ProductInfoes;
