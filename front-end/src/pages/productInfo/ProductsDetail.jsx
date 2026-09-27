const ProductDetails = ({ product }) => {
  return (
    <div className="flex flex-col justify-center p-6 sm:p-8 md:p-14">
      {/* برند */}
      <span
        className="
          mb-3
          text-xs
          uppercase
          tracking-[3px]
          text-zinc-500
          sm:text-sm
          sm:tracking-[4px]
        "
      >
        {product.brand}
      </span>

      {/* نام / کد محصول */}
      <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">
        {product.id}
      </h1>

      {/* خط جداکننده */}
      <div className="my-7 h-px bg-zinc-800 sm:my-10" />

      {/* اطلاعات محصول */}
      <div className="space-y-5 sm:space-y-6">
        {/* کد محصول */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 sm:pb-5">
          <span className="shrink-0 text-sm text-zinc-500">کد محصول</span>

          <span className="break-all text-left font-semibold">
            {product.id}
          </span>
        </div>

        {/* تعداد */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 sm:pb-5">
          <span className="shrink-0 text-sm text-zinc-500">تعداد</span>

          <span className="font-semibold">{product.count}</span>
        </div>

        {/* رنگ */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 sm:pb-5">
          <span className="shrink-0 text-sm text-zinc-500">رنگ</span>

          <span className="max-w-[60%] break-words text-left font-semibold">
            {product.color}
          </span>
        </div>
      </div>

      {/* قیمت */}
      <div className="mt-8 sm:mt-10">
        <span className="text-sm text-zinc-500">قیمت</span>

        <p className="mt-2 break-words text-3xl font-black sm:text-4xl">
          {product.price}
        </p>
      </div>

      {/* توضیحات */}
      <div className="mt-8 rounded-2xl bg-zinc-800/60 p-4 sm:mt-10 sm:p-6">
        <span className="text-sm text-zinc-500">توضیحات</span>

        <p className="mt-3 break-words text-sm leading-7 text-zinc-300 sm:text-base sm:leading-8">
          {product.description || "توضیحی برای این محصول ثبت نشده است."}
        </p>
      </div>
    </div>
  );
};

export default ProductDetails;
