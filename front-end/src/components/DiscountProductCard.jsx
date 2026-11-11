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
      className="theme-product-card group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-slate-700/70 bg-[#0b1425] text-white shadow-[0_12px_35px_rgba(0,0,0,.32)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-[0_18px_38px_rgba(0,0,0,.42),0_0_20px_rgba(34,211,238,.08)]"
    >
      {/* Product image */}
      <div className="theme-media-surface relative aspect-[4/3] overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,rgba(34,211,238,.13),transparent_60%),linear-gradient(145deg,#18263c,#101a2d_65%,#0b1425)]">
        {image ? (
          <img
            src={image}
            alt={product.title || "محصول تخفیف‌دار"}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-110 sm:p-5"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            تصویر موجود نیست
          </div>
        )}

        {/* Image overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1425]/75 via-transparent to-white/[0.02]"
        />

        {/* Discount badge */}
        <div className="theme-dark-overlay absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-xl border border-rose-300/20 bg-gradient-to-br from-rose-500 to-red-700 px-3 py-2 text-white shadow-[0_7px_20px_rgba(225,29,72,.28)]">
          <span className="text-xl font-black leading-none sm:text-2xl">
            {discountPercent.toLocaleString("fa-IR")}٪
          </span>
          <span className="text-[10px] font-extrabold sm:text-xs">تخفیف</span>
        </div>

        {/* Brand */}
        <div className="theme-dark-overlay absolute bottom-3 right-3 z-10 max-w-[75%] truncate rounded-full border border-white/10 bg-slate-950/65 px-3 py-1.5 text-[10px] font-bold text-cyan-200 shadow-lg backdrop-blur-md sm:text-xs">
          {product.brand || "فروشگاه کاظمی"}
        </div>
      </div>

      {/* Product information */}
      <div className="relative flex flex-1 flex-col p-3 sm:p-4">
        {/* Decorative line */}
        <div
          aria-hidden="true"
          className="absolute inset-x-5 top-0 h-px bg-gradient-to-l from-transparent via-cyan-400/50 to-transparent"
        />

        <h3 className="line-clamp-2 min-h-[44px] text-xs font-extrabold leading-6 text-slate-100 transition-colors duration-300 group-hover:text-cyan-200 sm:min-h-[52px] sm:text-sm sm:leading-7">
          {product.title || product.productCode}
        </h3>

        {/* Pricing */}
        <div className="mt-auto pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-slate-400 sm:text-xs">
              قیمت قبل از تخفیف
            </span>

            <span className="text-[10px] font-bold text-slate-500 line-through sm:text-xs">
              {formatPrice(originalPrice)} تومان
            </span>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-l from-cyan-950/70 via-slate-900/80 to-violet-950/30 p-2.5 sm:p-3">
            <span className="mb-1 block text-[10px] font-bold text-cyan-300 sm:text-xs">
              قیمت نهایی
            </span>

            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-xl font-black leading-tight tracking-tight text-white sm:text-2xl">
                {formatPrice(finalPrice)}
              </span>

              <span className="text-[10px] font-bold text-cyan-200 sm:text-xs">
                تومان
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div
        aria-hidden="true"
        className="h-0.5 w-full bg-gradient-to-l from-transparent via-cyan-400/70 to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-100"
      />
    </Link>
  );
};

export default DiscountProductCard;
