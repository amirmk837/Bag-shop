import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProductsPage, updateProduct } from "../../services/api";

const PAGE_SIZE = 10;

const formatPrice = (value) => Number(value || 0).toLocaleString("fa-IR");

const AdminDiscounts = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingCode, setUpdatingCode] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;

    const loadDiscounts = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getProductsPage({
          page,
          limit: PAGE_SIZE,
          discountedOnly: true,
          search: debouncedSearch,
        });

        if (active) {
          setProducts(result.products);
          setPagination(result.pagination);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "خطا در دریافت تخفیف‌ها");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDiscounts();

    return () => {
      active = false;
    };
  }, [page, debouncedSearch]);

  const handleDisableDiscount = async (product) => {
    const confirmed = window.confirm(
      `تخفیف محصول «${product.title || product.productCode}» غیرفعال شود؟`,
    );

    if (!confirmed) return;

    try {
      setUpdatingCode(product.productCode);
      setError("");

      await updateProduct(product.productCode, {
        title: product.title,
        categoryId: product.categoryId,
        count: product.count,
        color: product.color,
        price: product.price,
        discountedPrice: null,
        description: product.description,
        images: product.images || [],
      });

      setProducts((current) =>
        current.filter((item) => item.productCode !== product.productCode),
      );
      setPagination((current) =>
        current
          ? {
              ...current,
              total: Math.max(0, current.total - 1),
              totalPages: Math.ceil(Math.max(0, current.total - 1) / PAGE_SIZE),
            }
          : current,
      );

      if (products.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
    } catch (updateError) {
      setError(updateError.message || "غیرفعال‌سازی تخفیف انجام نشد");
    } finally {
      setUpdatingCode("");
    }
  };

  return (
    <section dir="rtl" className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">مدیریت تخفیف‌ها</h2>
          <p className="mt-2 text-sm text-zinc-400">
            محصولات دارای قیمت تخفیف‌خورده را جست‌وجو و مدیریت کنید.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {pagination ? `${formatPrice(pagination.total)} محصول تخفیف‌دار` : "در حال دریافت تعداد محصولات..."}
          </p>
        </div>
        <Link
          to="/admin/products"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-zinc-200 transition hover:bg-white/10"
        >
          مدیریت همه محصولات
        </Link>
      </header>

      <label className="block max-w-xl">
        <span className="mb-2 block text-sm font-medium text-zinc-300">جست‌وجوی محصول تخفیف‌دار</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="نام، کد محصول یا برند..."
          className="w-full rounded-xl border border-white/10 bg-[#111722] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/60"
        />
      </label>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111722]">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-400">در حال دریافت تخفیف‌ها...</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-bold text-zinc-200">
              {debouncedSearch ? "محصول تخفیف‌داری با این عبارت پیدا نشد." : "هنوز محصولی تخفیف‌دار نیست."}
            </p>
            <p className="mt-2 text-sm text-zinc-500">برای افزودن تخفیف، محصول را ویرایش کنید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-white/[0.04] text-xs text-zinc-400">
                <tr>
                  <th className="px-4 py-4 font-semibold">محصول</th>
                  <th className="px-4 py-4 font-semibold">قیمت اصلی</th>
                  <th className="px-4 py-4 font-semibold">قیمت تخفیف</th>
                  <th className="px-4 py-4 font-semibold">درصد</th>
                  <th className="px-4 py-4 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const percent = Math.round((1 - product.discountedPrice / product.price) * 100);
                  return (
                    <tr key={product.productCode} className="border-t border-white/[0.06]">
                      <td className="px-4 py-4">
                        <p className="font-bold text-zinc-100">{product.title || product.productCode}</p>
                        <p className="mt-1 text-xs text-zinc-500">{product.productCode} · {product.brand}</p>
                      </td>
                      <td className="px-4 py-4 text-zinc-400 line-through">{formatPrice(product.price)} تومان</td>
                      <td className="px-4 py-4 font-bold text-emerald-300">{formatPrice(product.discountedPrice)} تومان</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-300">٪{percent}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Link
                            to={`/admin/products/${encodeURIComponent(product.productCode)}/edit`}
                            className="rounded-lg bg-white/[0.07] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                          >
                            ویرایش
                          </Link>
                          <button
                            type="button"
                            disabled={updatingCode === product.productCode}
                            onClick={() => handleDisableDiscount(product)}
                            className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {updatingCode === product.productCode ? "در حال ذخیره..." : "غیرفعال‌سازی"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <nav aria-label="صفحه‌بندی تخفیف‌ها" className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            قبلی
          </button>
          <span className="text-sm tabular-nums text-zinc-400">
            صفحه {formatPrice(page)} از {formatPrice(pagination.totalPages)}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            بعدی
          </button>
        </nav>
      )}
    </section>
  );
};

export default AdminDiscounts;
