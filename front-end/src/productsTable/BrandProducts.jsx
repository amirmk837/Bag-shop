import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { getProducts } from "../services/api";
import ProductGridSkeleton from "../components/ProductGridSkeleton";

const BrandProducts = ({
  brand,
  productCodes,
  logo,
  logoAlt,
  logoClassName = "w-40",
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();

        if (cancelled) return;

        const allProducts = Array.isArray(data) ? data : [];

        let filteredProducts = allProducts;

        // فیلتر برند
        if (brand) {
          const normalizedBrand = brand.trim().toLowerCase();

          filteredProducts = filteredProducts.filter((product) => {
            const productBrand = product.brand?.trim().toLowerCase();
            const categoryName = product.category?.name?.trim().toLowerCase();

            return (
              productBrand === normalizedBrand ||
              categoryName === normalizedBrand
            );
          });
        }

        // فیلتر کد محصول؛ در صورت ارسال، با فیلتر برند ترکیب می‌شود.
        if (Array.isArray(productCodes) && productCodes.length > 0) {
          filteredProducts = filteredProducts.filter((product) =>
            productCodes.includes(product.productCode),
          );
        }

        setProducts(filteredProducts);
      } catch (error) {
        console.error("Brand products error:", error);

        if (!cancelled) {
          setError("خطا در دریافت محصولات");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [brand, productCodes]);

  if (loading) {
    return (
      <section
        className="w-full px-3 py-6 sm:px-5 md:px-6"
        dir="rtl"
        aria-busy="true"
      >
        <div className="mx-auto w-full max-w-7xl">
          <ProductGridSkeleton
            count={8}
            className="grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-7"
          />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center text-red-400"
        dir="rtl"
      >
        {error}
      </div>
    );
  }

  return (
    <section
      className="w-full px-3 py-6 sm:px-5 sm:py-8 md:px-6 md:py-10"
      dir="rtl"
    >
      <div className="mx-auto w-full max-w-7xl">
        {logo && (
          <div className="mb-6 flex justify-center sm:mb-10">
            <img
              src={logo}
              alt={logoAlt || (brand ? `لوگوی ${brand}` : "لوگوی فروشگاه")}
              className={`max-w-full object-contain ${logoClassName}`}
            />
          </div>
        )}

        {products.length === 0 ? (
          <div className="flex min-h-[30vh] items-center justify-center text-center text-zinc-400">
            محصولی برای این دسته پیدا نشد.
          </div>
        ) : (
          <div
            className="
              grid w-full min-w-0 grid-cols-2 gap-3
              max-[360px]:grid-cols-1
              sm:gap-5
              md:grid-cols-3 md:gap-6
              lg:grid-cols-4 lg:gap-7
            "
          >
            {products.map((product) => (
              <div key={product.productCode ?? product.id} className="min-w-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BrandProducts;
