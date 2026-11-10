import { Link } from "react-router-dom";

const formatPrice = (value) => Number(value || 0).toLocaleString("fa-IR");

const DiscountProductCard = ({ product }) => {
  const discountPercent = Math.round(
    (1 - product.discountedPrice / product.price) * 100,
  );
  const image = product.url?.[0];

  return (
    <Link
      to={`/product/${encodeURIComponent(product.productCode)}`}
      className="group min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/90 transition duration-300 hover:-translate-y-1 hover:border-red-400/40 hover:shadow-xl hover:shadow-red-950/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
        {image ? (
          <img
            src={image}
            alt={product.title || "محصول تخفیف‌دار"}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            تصویر موجود نیست
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-lg">
          ٪{discountPercent} تخفیف
        </span>
      </div>

      <div className="p-3 sm:p-4">
        <p className="mb-1 truncate text-[11px] text-zinc-500">{product.brand}</p>
        <h3 className="min-h-10 line-clamp-2 text-sm font-bold leading-6 text-white sm:text-base">
          {product.title || product.productCode}
        </h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-zinc-500 line-through">
            {formatPrice(product.price)} تومان
          </span>
          <span className="text-sm font-black text-emerald-300 sm:text-base">
            {formatPrice(product.discountedPrice)} تومان
          </span>
        </div>
      </div>
    </Link>
  );
};

export default DiscountProductCard;
