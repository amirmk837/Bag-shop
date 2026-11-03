import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCategories, getProducts } from "../services/api";
import ProductCard from "../productsTable/ProductCard";
import BackPage from "./BackPage";

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

        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        const foundCategory = categoriesData.find((item) => item.slug === slug);

        if (!foundCategory) {
          setError("دسته‌بندی پیدا نشد");
          return;
        }

        const filteredProducts = productsData.filter(
          (product) => product.category?.id === foundCategory.id,
        );

        setCategory(foundCategory);
        setProducts(filteredProducts);
      } catch (error) {
        console.error("Category products error:", error);
        setError("خطا در دریافت اطلاعات دسته‌بندی");
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
    <main dir="rtl" className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5"><BackPage fallback="/" /></div>
        <div className="mb-10 text-center">
          {category?.image && (
            <img
              src={category.image}
              alt={category.name}
              className="mx-auto mb-5 h-32 object-contain"
            />
          )}
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
