import { Link } from "react-router-dom";

const formatPrice = (value) => Number(value || 0).toLocaleString("fa-IR");

const DiscountProductCard = ({ product }) => {
  const originalPrice = Number(product.price);
  const finalPrice = Number(product.discountedPrice);
  const hasDiscount =
    Number.isSafeInteger(originalPrice) &&
    Number.isSafeInteger(finalPrice) &&
    originalPrice > 0 &&
    finalPrice > 0 &&
    finalPrice < originalPrice;

  if (!hasDiscount) return null;

  const discountPercent = Math.round((1 - finalPrice / originalPrice) * 100);
  const image = product.url?.[0];

  return (
    <Link
      to={`/product/${encodeURIComponent(product.productCode)}`}
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-cyan-900/70 bg-slate-950/90 text-slate-100 shadow-[0_8px_22px_rgba(0,0,0,.32)] transition duration-300 hover:-translate-y-1 hover:border-cyan-500/70 hover:bg-slate-900 hover:shadow-[0_14px_30px_rgba(0,0,0,.48),0_0_18px_rgba(34,211,238,.09)] sm:rounded-2xl"
    >
      <div className="relative z-10 aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-[0_10px_18px_-12px_rgba(0,0,0,.95)]">
        {image ? (
          <img
            src={image}
            alt={product.title || "محصول تخفیف‌دار"}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105 sm:p-4"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            تصویر موجود نیست
          </div>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-950/65 to-transparent"
        />

        <div className="absolute right-2 top-2 flex min-h-[62px] min-w-[68px] flex-col items-center justify-center gap-1 rounded-2xl border border-rose-300/40 bg-gradient-to-br from-rose-600 via-red-600 to-red-700 px-3 py-2 text-white shadow-[0_7px_20px_rgba(225,29,72,.3)] sm:right-3 sm:top-3 sm:min-h-[76px] sm:min-w-[82px] sm:rounded-[1.35rem] sm:px-4">
          <span className="text-2xl font-black leading-none tracking-tight sm:text-3xl">
            {discountPercent.toLocaleString("fa-IR")}٪
          </span>
          <span className="text-[10px] font-extrabold leading-tight sm:text-xs">
            تخفیف
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-l from-transparent via-cyan-700/60 to-transparent"
        />

        <div>
          <p className="mb-1 truncate text-[9px] font-bold tracking-wide text-cyan-400 sm:text-[10px]">
            {product.brand || "فروشگاه کاظمی"}
          </p>
          <h3 className="line-clamp-2 min-h-10 text-[11px] font-bold leading-5 text-slate-200 transition-colors duration-300 group-hover:text-cyan-200 sm:text-xs sm:leading-5">
            {product.title || product.productCode}
          </h3>
        </div>

        <div className="mt-auto border-t border-slate-800 pt-2.5">
          <p className="mb-1 text-[9px] text-slate-500 line-through sm:text-[10px]">
            {formatPrice(originalPrice)} تومان
          </p>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-black tracking-tight text-white sm:text-sm">
              {formatPrice(finalPrice)}
            </span>
            <span className="rounded-md border border-cyan-800/70 bg-cyan-950/70 px-1.5 py-1 text-[8px] font-extrabold text-cyan-300 sm:px-2 sm:text-[9px]">
              قیمت نهایی
            </span>
          </div>
        </div>
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-5 bottom-0 h-0.5 bg-gradient-to-l from-transparent via-cyan-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
    </Link>
  );
};

export default DiscountProductCard;
