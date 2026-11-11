const ProductInfoes = ({ product }) => {
  const price = Number(product.price);
  const discountedPrice = Number(product.discountedPrice);

  const hasValidPrice = Number.isFinite(price) && price > 0;

  const hasDiscount =
    hasValidPrice &&
    Number.isFinite(discountedPrice) &&
    discountedPrice > 0 &&
    discountedPrice < price;

  const finalPrice = hasDiscount ? discountedPrice : hasValidPrice ? price : 0;

  const discountPercent = hasDiscount
    ? Math.round((1 - discountedPrice / price) * 100)
    : 0;

  return (
    <div className="relative px-3 pb-4 pt-4 text-right sm:px-4 sm:pb-5 sm:pt-5">
      <div className="mb-2 flex min-w-0 items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
        <p className="truncate text-[11px] font-medium tracking-wide text-cyan-200/70 sm:text-xs">
          {product.brand || "بدون برند"}
        </p>
      </div>

      <h2 className="truncate text-sm font-bold leading-7 text-white transition-colors duration-300 group-hover:text-cyan-200 sm:text-base">
        {product.title || product.id}
      </h2>

      <div className="mt-3 flex min-w-0 items-end justify-between gap-2 border-t border-white/[0.07] pt-3 sm:mt-4 sm:pt-4">
        <span className="shrink-0 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2 py-1 text-[10px] text-slate-400 sm:text-xs">
          کد: {product.id}
        </span>

        <div className="flex min-w-0 flex-col items-end gap-1">
          {hasDiscount && (
            <>
              <span className="rounded-full border border-rose-400/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                {discountPercent}٪ تخفیف
              </span>

              <span className="text-[10px] text-slate-500 line-through sm:text-xs">
                {price.toLocaleString("fa-IR")} تومان
              </span>
            </>
          )}

          <span className="truncate text-sm font-extrabold tabular-nums text-cyan-300 sm:text-base">
            {finalPrice.toLocaleString("fa-IR")} تومان
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfoes;
