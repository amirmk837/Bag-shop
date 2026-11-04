import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getCategories, getProductsPage } from "../services/api";
import ProductCard from "../productsTable/ProductCard";
import BackPage from "./BackPage";

const PAGE_SIZE = 12;

const CategoryProducts = () => {
  const { slug } = useParams();
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const currentSlugRef = useRef(slug);

  if (currentSlugRef.current !== slug) {
    currentSlugRef.current = slug;
    loadingMoreRef.current = false;
  }

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError("");
        setProducts([]);
        setPagination(null);
        setLoadingMore(false);
        setLoadMoreError("");
        loadingMoreRef.current = false;

        const [pageData, categoriesData] = await Promise.all([
          getProductsPage({ categorySlug: slug, page: 1, limit: PAGE_SIZE }),
          getCategories(),
        ]);

        if (ignore) return;

        const foundCategory = categoriesData.find((item) => item.slug === slug);

        if (!foundCategory) {
          setError("دسته‌بندی پیدا نشد");
          return;
        }

        setCategory(foundCategory);
        setProducts(pageData.products);
        setPagination(pageData.pagination);
      } catch (requestError) {
        console.error("Category products error:", requestError);
        if (!ignore) setError("خطا در دریافت اطلاعات دسته‌بندی");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, [slug]);

  const loadMore = useCallback(async () => {
    if (!pagination?.hasMore || loadingMoreRef.current) return;

    const requestedSlug = slug;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError("");

    try {
      const nextPage = pagination.page + 1;
      const pageData = await getProductsPage({
        categorySlug: slug,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      if (currentSlugRef.current !== requestedSlug) return;

      setProducts((current) => [...current, ...pageData.products]);
      setPagination(pageData.pagination);
    } catch (requestError) {
      if (currentSlugRef.current !== requestedSlug) return;

      console.error("Load more products error:", requestError);
      setLoadMoreError("دریافت محصولات بعدی ناموفق بود. دوباره تلاش کنید.");
    } finally {
      if (currentSlugRef.current === requestedSlug) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [pagination, slug]);

  // صفحه بعد کمی پیش از رسیدن کاربر به انتهای فهرست دریافت می‌شود.
  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (
      !sentinel ||
      !pagination?.hasMore ||
      loadMoreError ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "500px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pagination?.hasMore, loadMore, loadMoreError]);

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
              decoding="async"
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
            {products.map((product, index) => (
              <ProductCard
                key={product.productCode}
                product={product}
                priority={index < 2}
              />
            ))}
          </div>
        )}

        {pagination?.hasMore && (
          <div ref={sentinelRef} className="flex min-h-24 flex-col items-center justify-center gap-3 py-6">
            {loadingMore && <p className="text-sm text-zinc-400">در حال دریافت محصولات بیشتر...</p>}
            {loadMoreError && <p role="alert" className="text-sm text-red-400">{loadMoreError}</p>}
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-xl border border-zinc-600 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              {loadingMore ? "در حال بارگذاری..." : "نمایش محصولات بیشتر"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default CategoryProducts;
