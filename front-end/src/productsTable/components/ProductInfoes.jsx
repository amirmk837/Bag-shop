const ProductInfoes = ({ product }) => {
  return (
    <div className="px-3 pb-3 pt-4 sm:pt-5">
      {/* برند */}
      <p
        className="
          mb-2
          truncate
          text-[11px]
          font-medium
          tracking-wider
          text-zinc-500
          sm:text-xs
        "
      >
        {product.brand}
      </p>

      {/* عنوان */}
      <h2
        className="
          truncate
          text-base
          font-bold
          text-white
          sm:text-lg
        "
      >
        {product.title || product.id}
      </h2>

      {/* قیمت و ID */}
      <div
        className="
          mt-3
          flex
          min-w-0
          items-center
          justify-between
          gap-2
          sm:mt-4
        "
      >
        <span className="shrink-0 text-[11px] text-zinc-500 sm:text-xs">
          {product.id}
        </span>

        <span className="flex min-w-0 flex-col items-end gap-1">
          {product.discountedPrice && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">٪{Math.round((1 - product.discountedPrice / product.price) * 100)} تخفیف</span>}
          {product.discountedPrice && <span className="text-xs text-zinc-500 line-through">{Number(product.price).toLocaleString("fa-IR")} تومان</span>}
          <span className="truncate text-sm font-bold text-white sm:text-base">{Number(product.discountedPrice ?? product.price ?? 0).toLocaleString("fa-IR")} تومان</span>
        </span>
      </div>
    </div>
  );
};

export default ProductInfoes;
