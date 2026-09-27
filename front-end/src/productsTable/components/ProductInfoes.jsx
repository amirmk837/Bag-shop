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

        <span
          className="
            min-w-0
            truncate
            text-sm
            font-bold
            text-white
            sm:text-base
          "
        >
          {product.price} تومان
        </span>
      </div>
    </div>
  );
};

export default ProductInfoes;
