import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getProducts } from "../services/api";
import ProductCard from "../productsTable/ProductCard";

const CategoryProducts = () => {
  const { slug } = useParams();

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const allProducts = await getProducts();

        const filteredProducts = allProducts.filter(
          (product) => product.category?.slug === slug,
        );

        setProducts(filteredProducts);

        const foundCategory = filteredProducts[0]?.category || null;

        setCategory(foundCategory);
      } catch (error) {
        console.error("Category products error:", error);

        setError("خطا در دریافت محصولات");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-zinc-400">
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
    <main dir="rtl" className="min-h-screen bg-zinc-900 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-white">
            {category?.name || "دسته‌بندی"}
          </h1>

          <p className="mt-3 text-zinc-400">محصولات این دسته‌بندی</p>
        </div>

        {products.length === 0 ? (
          <div className="flex min-h-[30vh] items-center justify-center text-zinc-500">
            محصولی در این دسته‌بندی وجود ندارد.
          </div>
        ) : (
          <div
            className="
              grid
              grid-cols-1
              justify-items-center
              gap-6
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
            "
          >
            {products.map((product) => (
              <ProductCard key={product.productCode} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default CategoryProducts;
