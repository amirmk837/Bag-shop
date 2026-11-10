import { useEffect, useState } from "react";
import { getProductsPage } from "../services/api";
import DiscountProductCard from "../components/DiscountProductCard";
import BackPage from "../components/BackPage";

const PAGE_SIZE = 12;
const formatNumber = (value) => Number(value || 0).toLocaleString("fa-IR");

const DiscountProducts = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getProductsPage({
          page,
          limit: PAGE_SIZE,
          discountedOnly: true,
        });
        if (active) {
          setProducts(result.products);
          setPagination(result.pagination);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "دریافت محصولات ناموفق بود.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [page]);

  return (
    <main dir="rtl" className="mx-auto min-h-[60vh] w-full max-w-7xl px-3 py-8 sm:px-5 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-bold text-red-300">فرصت‌های خرید</p>
          <h1 className="text-2xl font-black text-white sm:text-3xl">همه تخفیف‌ها</h1>
          {pagination && <p className="mt-2 text-sm text-zinc-400">{formatNumber(pagination.total)} محصول تخفیف‌دار</p>}
        </div>
        <BackPage fallback="/" />
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-zinc-800" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-10 text-center">
          <p className="font-bold text-zinc-200">در حال حاضر تخفیفی برای نمایش وجود ندارد.</p>
          <p className="mt-2 text-sm text-zinc-500">بعداً دوباره سر بزنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => <DiscountProductCard key={product.productCode} product={product} />)}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav aria-label="صفحه‌بندی محصولات تخفیف‌دار" className="mt-8 flex items-center justify-center gap-3">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-200 disabled:opacity-40">قبلی</button>
          <span className="text-sm text-zinc-400">صفحه {formatNumber(page)} از {formatNumber(pagination.totalPages)}</span>
          <button type="button" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-200 disabled:opacity-40">بعدی</button>
        </nav>
      )}
    </main>
  );
};

export default DiscountProducts;
