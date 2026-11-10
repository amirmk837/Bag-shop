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
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-orange-300/20 bg-[#111824] shadow-[0_12px_35px_rgba(0,0,0,.3)] transition duration-300 hover:-translate-y-1.5 hover:border-orange-300/55 hover:shadow-[0_22px_50px_rgba(249,115,22,.16)] sm:rounded-[1.4rem]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,rgba(255,255,255,.09),transparent_65%),linear-gradient(145deg,#202a39,#0b1018)]">
        {image ? (
          <img src={image} alt={product.title || "محصول تخفیف‌دار"} loading="lazy" className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-110 sm:p-5" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">تصویر موجود نیست</div>
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#111824]/90 to-transparent" />
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-xl border border-white/20 bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 px-3 py-2 text-white shadow-[0_8px_24px_rgba(239,68,68,.4)]">
          <span className="text-xl font-black leading-none sm:text-2xl">{discountPercent.toLocaleString("fa-IR")}٪</span>
          <span className="text-[9px] font-extrabold leading-tight sm:text-[10px]">تخفیف</span>
        </div>
        <span className="absolute bottom-3 left-3 rounded-lg border border-emerald-300/20 bg-[#071b17]/90 px-2.5 py-1.5 text-[9px] font-bold text-emerald-300 backdrop-blur-sm sm:text-[10px]">
          {formatPrice(saving)} تومان کمتر
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="mb-1 truncate text-[10px] font-bold tracking-wide text-orange-200/80 sm:text-[11px]">{product.brand || "فروشگاه کاظمی"}</p>
        <h3 className="line-clamp-2 min-h-10 text-xs font-bold leading-5 text-zinc-100 transition group-hover:text-orange-100 sm:text-sm sm:leading-6">{product.title || product.productCode}</h3>

        <div className="mt-auto border-t border-white/[0.08] pt-3">
          <p className="mb-1 text-[10px] text-zinc-500 line-through sm:text-xs">{formatPrice(originalPrice)} تومان</p>
          <div className="flex items-center justify-between gap-1">
            <span className="text-base font-black tracking-tight text-white sm:text-lg">{formatPrice(finalPrice)}</span>
            <span className="rounded-lg bg-orange-400/10 px-2 py-1 text-[9px] font-extrabold text-orange-200 sm:text-[10px]">قیمت بعد از تخفیف</span>
          </div>
        </div>
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-5 bottom-0 h-0.5 bg-gradient-to-l from-transparent via-orange-300 to-transparent opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
};

export default DiscountProductCard;
