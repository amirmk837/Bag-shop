import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProductsPage } from "../../services/api";
import DiscountProductCard from "../../components/DiscountProductCard";

const DiscountShowcase = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDiscounts = async () => {
      try {
        const result = await getProductsPage({
          page: 1,
          limit: 8,
          discountedOnly: true,
        });
        if (active) setProducts(result.products);
      } catch (loadError) {
        if (active) setError(loadError.message || "دریافت پیشنهادهای ویژه ناموفق بود.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDiscounts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section dir="rtl" className="mx-auto my-8 w-full max-w-7xl px-3 sm:my-10 sm:px-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-bold tracking-wide text-red-300">فرصت خرید با قیمت بهتر</p>
          <h2 className="text-xl font-black text-white sm:text-2xl">پیشنهادهای ویژه و تخفیف‌ها</h2>
        </div>
        <Link
          to="/discounts"
          className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20 sm:text-sm"
        >
          مشاهده همه تخفیف‌ها
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-2">
              <div className="aspect-[4/3] animate-pulse rounded-xl bg-zinc-800" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
              <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p role="status" className="rounded-xl border border-white/10 bg-zinc-900/70 p-5 text-sm text-zinc-400">
          پیشنهادهای ویژه در حال حاضر بارگذاری نشدند.
        </p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-900/50 px-5 py-8 text-center">
          <p className="font-bold text-zinc-200">در حال حاضر محصول تخفیف‌داری موجود نیست.</p>
          <p className="mt-2 text-sm text-zinc-500">به‌زودی پیشنهادهای ویژه جدید اضافه می‌شوند.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <DiscountProductCard key={product.productCode} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

export default DiscountShowcase;
