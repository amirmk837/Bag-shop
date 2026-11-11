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
  const [sortBy, setSortBy] = useState("discountPercent");
  const [sortOrder, setSortOrder] = useState("desc");
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
          page, limit: PAGE_SIZE, discountedOnly: true,
          search: debouncedSearch, sortBy, sortOrder,
        });
        if (active) {
          setProducts(result.products.filter((product) => {
            const price = Number(product.price);
            const discounted = Number(product.discountedPrice);
            return Number.isSafeInteger(price) && Number.isSafeInteger(discounted) && price > 0 && discounted > 0 && discounted < price;
          }));
          setPagination(result.pagination);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "خطا در دریافت تخفیف‌ها");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDiscounts();
    return () => { active = false; };
  }, [page, debouncedSearch, sortBy, sortOrder]);

  const handleDisableDiscount = async (product) => {
    const confirmed = window.confirm(`تخفیف محصول «${product.title || product.productCode}» غیرفعال شود؟`);
    if (!confirmed) return;
    try {
      setUpdatingCode(product.productCode);
      setError("");
      const updated = await updateProduct(product.productCode, {
        title: product.title, categoryId: product.categoryId, count: product.count,
        color: product.color, price: product.price, discountedPrice: null,
        description: product.description, images: product.images || [],
      });
      if (updated.discountedPrice != null) throw new Error("سرور حذف تخفیف را تأیید نکرد.");
      const result = await getProductsPage({
        page, limit: PAGE_SIZE, discountedOnly: true,
        search: debouncedSearch, sortBy, sortOrder,
      });
      setProducts(result.products);
      setPagination(result.pagination);
      if (page > Math.max(1, result.pagination.totalPages) && page > 1) {
        setPage(Math.max(1, result.pagination.totalPages));
      }
    } catch (updateError) {
      setError(updateError.message || "غیرفعال‌سازی تخفیف انجام نشد");
    } finally {
      setUpdatingCode("");
    }
  };

  return (
    <section dir="rtl" className="space-y-6 text-zinc-100">
      <header className="theme-admin-hero relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b111c] p-5 shadow-[0_20px_60px_rgba(0,0,0,.24)] sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-24 -z-10 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-[90px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -bottom-28 -z-10 h-64 w-64 rounded-full bg-amber-400/15 blur-[90px]" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-3 py-1.5 text-[10px] font-black tracking-[.15em] text-amber-200">٪ PROMOTIONS CONTROL</div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">مدیریت تخفیف‌ها</h2>
            <p className="mt-2 max-w-xl text-xs leading-6 text-zinc-400 sm:text-sm">مرتب‌سازی، جست‌وجو و کنترل قیمت نهایی محصولات دارای تخفیف معتبر.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <p className="text-[10px] font-semibold text-zinc-500">تعداد تخفیف فعال</p>
              <p className="mt-1 text-xl font-black tabular-nums text-amber-200">{pagination ? formatPrice(pagination.total) : "—"}</p>
            </div>
            <Link to="/admin/products" className="admin-primary-action inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-600 px-4 text-xs font-black transition hover:-translate-y-0.5">افزودن / ویرایش محصول</Link>
          </div>
        </div>
      </header>

      <div className="grid gap-4 rounded-2xl border border-white/[0.08] bg-[#111824] p-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,280px)_auto] sm:items-end sm:p-5">
        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-bold text-zinc-400">جست‌وجوی محصولات تخفیف‌دار</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="نام، کد محصول یا برند..." className="w-full rounded-xl border border-white/10 bg-[#090e16] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/10" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold text-zinc-400">مرتب‌سازی بر اساس</span>
          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="w-full rounded-xl border border-white/10 bg-[#090e16] px-3 py-3 text-sm text-zinc-100 outline-none focus:border-amber-300/50">
            <option value="discountPercent">بیشترین درصد تخفیف</option>
            <option value="discountedPrice">بیشترین قیمت پس از تخفیف</option>
          </select>
        </label>
        <button type="button" onClick={() => { setSortOrder((current) => current === "desc" ? "asc" : "desc"); setPage(1); }} aria-label={sortOrder === "desc" ? "تغییر به ترتیب صعودی" : "تغییر به ترتیب نزولی"} title={sortOrder === "desc" ? "نزولی؛ کلیک برای صعودی" : "صعودی؛ کلیک برای نزولی"} className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] px-4 text-sm font-bold text-amber-100 transition hover:border-amber-300/45 hover:bg-amber-300/[0.12]">
          <span className="text-xl leading-none">{sortOrder === "desc" ? "↓" : "↑"}</span>
          <span>{sortOrder === "desc" ? "نزولی" : "صعودی"}</span>
        </button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111824] shadow-[0_16px_48px_rgba(0,0,0,.18)]">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-400">در حال دریافت تخفیف‌ها...</div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] text-xl text-amber-200">٪</div>
            <p className="font-bold text-zinc-200">{debouncedSearch ? "محصول تخفیف‌داری با این عبارت پیدا نشد." : "هنوز محصول تخفیف‌دار معتبری ثبت نشده است."}</p>
            <p className="mt-2 text-sm text-zinc-500">برای افزودن تخفیف، محصول را از بخش مدیریت محصولات ویرایش کنید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-white/[0.035] text-[11px] text-zinc-400">
                <tr>
                  <th className="px-4 py-4 font-bold">محصول</th>
                  <th className="px-4 py-4 font-bold">قیمت اصلی</th>
                  <th className="px-4 py-4 font-bold">قیمت نهایی</th>
                  <th className="px-4 py-4 font-bold">میزان تخفیف</th>
                  <th className="px-4 py-4 font-bold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const percent = Math.round((1 - product.discountedPrice / product.price) * 100);
                  return (
                    <tr key={product.productCode} className="border-t border-white/[0.06] transition hover:bg-white/[0.025]">
                      <td className="px-4 py-4">
                        <p className="font-bold text-zinc-100">{product.title || product.productCode}</p>
                        <p className="mt-1 text-xs text-zinc-500">{product.productCode} · {product.brand}</p>
                      </td>
                      <td className="px-4 py-4 text-zinc-500 line-through">{formatPrice(product.price)} تومان</td>
                      <td className="px-4 py-4 font-black text-emerald-300">{formatPrice(product.discountedPrice)} تومان</td>
                      <td className="px-4 py-4"><span className="inline-flex rounded-lg border border-rose-300/15 bg-rose-400/10 px-2.5 py-1 text-xs font-black text-rose-200">٪{formatPrice(percent)}</span></td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Link to={`/admin/products/${encodeURIComponent(product.productCode)}/edit`} className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-zinc-200 transition hover:border-amber-300/25 hover:text-amber-100">ویرایش</Link>
                          <button type="button" disabled={updatingCode === product.productCode} onClick={() => handleDisableDiscount(product)} className="rounded-lg border border-rose-400/15 bg-rose-400/[0.07] px-3 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-400/[0.14] disabled:cursor-not-allowed disabled:opacity-50">{updatingCode === product.productCode ? "در حال ذخیره..." : "حذف تخفیف"}</button>
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
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-xl border border-white/10 bg-[#111824] px-4 py-2 text-sm text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40">قبلی</button>
          <span className="text-sm tabular-nums text-zinc-400">صفحه {formatPrice(page)} از {formatPrice(pagination.totalPages)}</span>
          <button type="button" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))} className="rounded-xl border border-white/10 bg-[#111824] px-4 py-2 text-sm text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40">بعدی</button>
        </nav>
      )}
    </section>
  );
};

export default AdminDiscounts;
