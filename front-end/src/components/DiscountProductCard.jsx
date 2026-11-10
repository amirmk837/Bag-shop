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
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111722] transition duration-300 hover:-translate-y-1 hover:border-amber-300/35 hover:shadow-[0_18px_45px_rgba(0,0,0,.28)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0b1018]">
        {image ? (
          <img
            src={image}
            alt={product.title || "محصول تخفیف‌دار"}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.04] sm:p-5"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">
            تصویر موجود نیست
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-md border border-amber-300/25 bg-[#171a20]/95 px-2.5 py-1 text-[11px] font-black text-amber-200 shadow-lg">
          {discountPercent.toLocaleString("fa-IR")}٪ تخفیف
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="mb-1 truncate text-[10px] font-semibold tracking-wide text-zinc-500 sm:text-[11px]">
          {product.brand}
        </p>
        <h3 className="line-clamp-2 min-h-10 text-xs font-bold leading-5 text-zinc-100 sm:text-sm sm:leading-6">
          {product.title || product.productCode}
        </h3>

        <div className="mt-auto border-t border-white/[0.07] pt-3">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-[10px] text-zinc-500 line-through sm:text-xs">
              {formatPrice(originalPrice)} تومان
            </span>
            <span className="text-sm font-black tracking-tight text-amber-200 sm:text-base">
              {formatPrice(finalPrice)} <span className="text-[10px] font-medium text-zinc-400">تومان</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DiscountProductCard;
