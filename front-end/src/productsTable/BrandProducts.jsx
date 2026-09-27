import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { getProducts } from "../services/api";

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
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();

        let filteredProducts = data;

        if (brand) {
          filteredProducts = data.filter(
            (product) => product.brand?.toLowerCase() === brand.toLowerCase(),
          );
        }

        if (productCodes) {
          filteredProducts = data.filter((product) =>
            productCodes.includes(product.productCode),
          );
        }

        setProducts(filteredProducts);
      } catch (error) {
        console.error("Brand products error:", error);
        setError("خطا در دریافت محصولات");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [brand, productCodes]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white">
        در حال دریافت محصولات...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div
      className="w-full px-3 py-6 sm:px-5 sm:py-8 md:px-6 md:py-10"
      dir="rtl"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex justify-center">
          <img
            src={logo}
            alt={logoAlt}
            className={`mb-8 sm:mb-10 ${logoClassName}`}
          />
        </div>

        {products.length === 0 ? (
          <div className="flex min-h-[30vh] items-center justify-center text-zinc-500">
            محصولی برای این دسته پیدا نشد.
          </div>
        ) : (
          <div
            className="
              grid
              w-full
              min-w-0
              grid-cols-1
              gap-4
              sm:grid-cols-2
              sm:gap-5
              md:grid-cols-3
              md:gap-6
              lg:grid-cols-4
              lg:gap-8
            "
          >
            {products.map((product) => (
              <div key={product.productCode} className="w-full min-w-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandProducts;
