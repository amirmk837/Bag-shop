import { Link } from "react-router-dom";

const formatPrice = (value) => Number(value || 0).toLocaleString("fa-IR");

const DiscountProductCard = ({ product }) => {
  const originalPrice = Number(product.price);
  const finalPrice = Number(product.discountedPrice);
  const hasDiscount =
    Number.isSafeInteger(originalPrice) &&
    Number.isSafeInteger(finalPrice) &&
    finalPrice > 0 &&
    finalPrice < originalPrice;
  if (!hasDiscount) return null;

  const discountPercent = Math.round((1 - finalPrice / originalPrice) * 100);
  const saving = originalPrice - finalPrice;
  const image = product.url?.[0];

  return (
    <Link
      to={`/product/${encodeURIComponent(product.productCode)}`}
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/80 bg-white text-slate-800 shadow-[0_5px_16px_rgba(120,45,20,.16)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(120,45,20,.22)] sm:rounded-2xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        {image ? (
          <img src={image} alt={product.title || "محصول تخفیف‌دار"} loading="lazy" className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105 sm:p-4" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">تصویر موجود نیست</div>
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white/80 to-transparent" />
        <div className="absolute right-2 top-2 flex min-h-[48px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl border border-white/70 bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 px-2 py-1.5 text-white shadow-[0_5px_16px_rgba(239,68,68,.35)] sm:right-3 sm:top-3 sm:min-h-[58px] sm:min-w-[64px] sm:rounded-2xl sm:px-3">
          <span className="text-xl font-black leading-none tracking-tight sm:text-2xl">{discountPercent.toLocaleString("fa-IR")}٪</span>
          <span className="text-[9px] font-extrabold leading-tight sm:text-[10px]">تخفیف</span>
        </div>
        <span className="absolute bottom-2 left-2 rounded-md bg-emerald-600 px-2 py-1 text-[8px] font-bold text-white shadow sm:bottom-3 sm:left-3 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-[9px]">
          {formatPrice(saving)} تومان کمتر
        </span>
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <p className="mb-1 truncate text-[9px] font-bold tracking-wide text-orange-600 sm:text-[10px]">{product.brand || "فروشگاه کاظمی"}</p>
        <h3 className="line-clamp-2 min-h-10 text-[11px] font-bold leading-5 text-slate-700 transition group-hover:text-orange-700 sm:text-xs sm:leading-5">{product.title || product.productCode}</h3>

        <div className="mt-auto border-t border-slate-100 pt-2.5">
          <p className="mb-1 text-[9px] text-slate-400 line-through sm:text-[10px]">{formatPrice(originalPrice)} تومان</p>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-black tracking-tight text-slate-800 sm:text-sm">{formatPrice(finalPrice)}</span>
            <span className="rounded-md bg-orange-50 px-1.5 py-1 text-[8px] font-extrabold text-orange-700 sm:px-2 sm:text-[9px]">قیمت بعد از تخفیف</span>
          </div>
        </div>
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-5 bottom-0 h-0.5 bg-gradient-to-l from-transparent via-orange-400 to-transparent opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
};

export default DiscountProductCard;
