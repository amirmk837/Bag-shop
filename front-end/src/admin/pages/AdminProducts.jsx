import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteProduct, getProductsPage } from "../../services/api";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination((current) => ({ ...current, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let ignore = false;
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await getProductsPage({ page: pagination.page, limit: 10, search });
        if (ignore) return;
        setProducts(result.products);
        setPagination((current) => ({ ...current, ...result.pagination }));
      } catch (requestError) {
        if (!ignore) setError(requestError.message || "خطا در دریافت محصولات");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadProducts();
    return () => { ignore = true; };
  }, [pagination.page, search]);

  const handleDelete = async (productCode) => {
    if (!window.confirm(`آیا از حذف محصول ${productCode} مطمئن هستید؟`)) return;
    try {
      setDeleting(productCode);
      await deleteProduct(productCode);
      if (products.length === 1 && pagination.page > 1) {
        setPagination((current) => ({ ...current, page: current.page - 1 }));
      } else {
        const result = await getProductsPage({ page: pagination.page, limit: 10, search });
        setProducts(result.products);
        setPagination((current) => ({ ...current, ...result.pagination }));
      }
    } catch (requestError) {
      window.alert(requestError.message || "خطا در حذف محصول");
    } finally {
      setDeleting("");
    }
  };

  return (
    <div dir="rtl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-2xl font-bold">مدیریت محصولات</h2><p className="mt-2 text-sm text-zinc-400">{Number(pagination.total || 0).toLocaleString("fa-IR")} محصول</p></div>
        <Link to="/admin/products/create" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-zinc-900 transition hover:bg-zinc-200">افزودن محصول</Link>
      </div>
      <div className="mb-5">
        <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="جست‌وجوی نام، برند یا کد محصول..." aria-label="جست‌وجوی محصولات" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-zinc-400" />
      </div>
      {error && <div role="alert" className="mb-5 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">{error}</div>}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900">
        <table className="w-full min-w-[950px] text-right">
          <thead className="bg-zinc-800/60"><tr><th className="px-4 py-4">کد محصول</th><th className="px-4 py-4">عنوان</th><th className="px-4 py-4">برند</th><th className="px-4 py-4">موجودی</th><th className="px-4 py-4">قیمت</th><th className="px-4 py-4">عملیات</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">در حال دریافت محصولات...</td></tr> :
              products.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">{search ? "محصولی با این عبارت پیدا نشد." : "هیچ محصولی وجود ندارد."}</td></tr> :
              products.map((product) => <tr key={product.productCode} className="border-t border-zinc-800 transition hover:bg-zinc-800/30">
                <td className="px-4 py-4 font-medium">{product.productCode}</td>
                <td className="max-w-[280px] px-4 py-4"><span className="block truncate text-zinc-300" title={product.title}>{product.title}</span></td>
                <td className="px-4 py-4 text-zinc-400">{product.brand}</td>
                <td className="px-4 py-4">{product.count}</td>
                <td className="whitespace-nowrap px-4 py-4">{Number(product.price || 0).toLocaleString("fa-IR")} تومان</td>
                <td className="px-4 py-4"><div className="flex flex-wrap gap-2">
                  <Link to={`/admin/products/${encodeURIComponent(product.productCode)}/edit`} className="inline-flex items-center justify-center rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700">ویرایش</Link>
                  <button type="button" disabled={deleting === product.productCode} onClick={() => handleDelete(product.productCode)} className="rounded-lg bg-red-950/50 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50">{deleting === product.productCode ? "در حال حذف..." : "حذف"}</button>
                </div></td>
              </tr>)
            }
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" disabled={loading || pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} className="rounded-xl bg-zinc-800 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">قبلی</button>
        <span className="text-sm text-zinc-400">صفحه {Number(pagination.page || 1).toLocaleString("fa-IR")} از {Number(pagination.totalPages || 0).toLocaleString("fa-IR")}</span>
        <button type="button" disabled={loading || pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} className="rounded-xl bg-zinc-800 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">بعدی</button>
      </div>
    </div>
  );
};

export default AdminProducts;
