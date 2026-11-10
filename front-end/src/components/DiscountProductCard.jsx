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
  const image = product.url?.[0];

  return (
    <Link
      to={`/product/${encodeURIComponent(product.productCode)}`}
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111824] shadow-[0_10px_30px_rgba(0,0,0,.18)] transition duration-300 hover:-translate-y-1 hover:border-amber-300/35 hover:shadow-[0_20px_48px_rgba(0,0,0,.38)] sm:rounded-[1.35rem]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,rgba(255,255,255,.07),transparent_65%),linear-gradient(145deg,#182231,#0b1018)]">
        {image ? (
          <img src={image} alt={product.title || "محصول تخفیف‌دار"} loading="lazy" className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105 sm:p-5" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">تصویر موجود نیست</div>
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#111824]/70 to-transparent" />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg border border-rose-300/25 bg-gradient-to-l from-rose-500 to-orange-500 px-2.5 py-1.5 text-[10px] font-black text-white shadow-[0_6px_18px_rgba(244,63,94,.25)] sm:text-xs">
          <span aria-hidden="true">٪</span>{discountPercent.toLocaleString("fa-IR")} تخفیف
        </span>
        <span className="absolute left-3 top-3 rounded-md border border-white/10 bg-black/45 px-2 py-1 text-[9px] font-bold tracking-wider text-zinc-300 backdrop-blur-sm">SPECIAL</span>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="mb-1 truncate text-[10px] font-bold tracking-wide text-amber-200/70 sm:text-[11px]">{product.brand || "KAZEMI STORE"}</p>
        <h3 className="line-clamp-2 min-h-10 text-xs font-bold leading-5 text-zinc-100 transition group-hover:text-amber-100 sm:text-sm sm:leading-6">{product.title || product.productCode}</h3>

        <div className="mt-auto border-t border-white/[0.08] pt-3">
          <div className="mb-1 flex items-center justify-between gap-1">
            <span className="text-[10px] text-zinc-500 line-through sm:text-xs">{formatPrice(originalPrice)} تومان</span>
            <span className="rounded-md bg-emerald-400/[0.09] px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">قیمت ویژه</span>
          </div>
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-sm font-black tracking-tight text-white sm:text-base">{formatPrice(finalPrice)}</span>
            <span className="text-[10px] font-semibold text-zinc-400">تومان</span>
          </div>
        </div>
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-5 bottom-0 h-px bg-gradient-to-l from-transparent via-amber-300/50 to-transparent opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
};

export default DiscountProductCard;
