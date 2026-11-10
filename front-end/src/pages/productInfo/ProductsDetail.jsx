import { useMemo, useState } from "react";
import AddToCartButton from "../../components/cart/AddToCartButton";

const ProductDetails = ({ product }) => {
  // داخل کامپوننت ProductDetails، جایگزین بخش قبلی colors و selectedColor

  const colors = useMemo(() => {
    const rawColors = product.color;

    const list = Array.isArray(rawColors)
      ? rawColors
      : typeof rawColors === "string"
        ? rawColors.split(/[,،\n|]/)
        : [];

    return [
      ...new Set(list.map((color) => String(color).trim()).filter(Boolean)),
    ];
  }, [product.color]);

  const [selectedColor, setSelectedColor] = useState(() =>
    colors.length === 1 ? colors[0] : "",
  );
  const [previousColors, setPreviousColors] = useState(colors);

  if (previousColors !== colors) {
    setPreviousColors(colors);
    setSelectedColor(colors.length === 1 ? colors[0] : "");
  }

  const hasMultipleColors = colors.length > 1;
  const hasColor = colors.length > 0;
  const originalPrice = Number(product.price);
  const discountedPrice = Number(product.discountedPrice);
  const hasValidDiscount =
    Number.isSafeInteger(originalPrice) &&
    originalPrice > 0 &&
    Number.isSafeInteger(discountedPrice) &&
    discountedPrice > 0 &&
    discountedPrice < originalPrice;

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
        {product.title || product.productCode || product.id}
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

        {/* موجودی */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4 sm:pb-5">
          <span className="shrink-0 text-sm text-zinc-500">تعداد</span>

          <span className="font-semibold">{product.count}</span>
        </div>

        {/* رنگ */}
        <div className="border-b border-zinc-800 pb-4 sm:pb-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="shrink-0 text-sm text-zinc-500">رنگ</span>

            {!hasColor && (
              <span className="text-sm text-zinc-600">بدون رنگ‌بندی</span>
            )}
          </div>

          {hasColor && hasMultipleColors && (
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const isSelected = selectedColor === color;

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`
                      rounded-xl
                      border
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      transition

                      ${
                        isSelected
                          ? "border-white bg-white text-zinc-900"
                          : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                      }
                    `}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          )}

          {hasColor && !hasMultipleColors && (
            <span className="font-semibold">{colors[0]}</span>
          )}

          {hasMultipleColors && !selectedColor && (
            <p className="mt-3 text-xs text-amber-500">
              ابتدا رنگ موردنظر خود را انتخاب کنید.
            </p>
          )}
        </div>
      </div>

      {/* قیمت */}
      <div className="mt-8 sm:mt-10">
        <span className="text-sm text-zinc-500">{hasValidDiscount ? "قیمت پس از تخفیف" : "قیمت"}</span>

        {hasValidDiscount && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">
              ٪{Math.round((1 - discountedPrice / originalPrice) * 100)} تخفیف
            </span>
            <span className="text-base text-zinc-500 line-through">
              {originalPrice.toLocaleString("fa-IR")} تومان
            </span>
          </div>
        )}
        <p className="mt-2 break-words text-3xl font-black sm:text-4xl">
          {(hasValidDiscount ? discountedPrice : originalPrice).toLocaleString("fa-IR")} تومان
        </p>
      </div>

      {/* توضیحات */}
      <div className="mb-10 mt-8 rounded-2xl bg-zinc-800/60 p-4 sm:mt-10 sm:p-6">
        <span className="text-sm text-zinc-500">توضیحات</span>

        <p className="mt-3 break-words text-sm leading-7 text-zinc-300 sm:text-base sm:leading-8">
          {product.description || "توضیحی برای این محصول ثبت نشده است."}
        </p>
      </div>

      {/* افزودن به سبد */}
      <AddToCartButton
        productCode={product.productCode}
        productTitle={product.title}
        productImage={product.images?.[0]}
        color={selectedColor}
        requireColor={colors.length > 0}
      />
    </div>
  );
};

export default ProductDetails;
