import { useMemo, useState } from "react";
import AddToCartButton from "../../components/cart/AddToCartButton";

const ProductDetails = ({ product }) => {
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

  const finalPrice = hasValidDiscount ? discountedPrice : originalPrice;

  return (
    <div
      className="
        theme-content-panel relative flex min-w-0 flex-col justify-center
        overflow-hidden
        bg-gradient-to-br from-[#14243b] via-[#101c31] to-[#0c1526]
        p-5 text-right
        sm:p-8 md:p-10 lg:p-14
      "
    >
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-cyan-500/[0.06] blur-[90px]" />

      <div className="relative">
        {/* برند */}
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

          <span
            className="
              text-xs font-semibold uppercase tracking-[2px]
              text-cyan-200/70 sm:text-sm sm:tracking-[3px]
            "
          >
            {product.brand || "بدون برند"}
          </span>
        </div>

        {/* نام محصول */}
        <h1 className="break-words text-2xl font-extrabold leading-relaxed tracking-tight text-white sm:text-3xl md:text-4xl">
          {product.title || product.productCode || product.id}
        </h1>

        {/* جداکننده */}
        <div className="my-7 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent sm:my-9" />

        {/* اطلاعات محصول */}
        <div className="space-y-5 sm:space-y-6">
          {/* کد محصول */}
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4 sm:pb-5">
            <span className="shrink-0 text-sm text-slate-400">کد محصول</span>

            <span className="break-all text-left text-sm font-semibold text-slate-200">
              {product.id}
            </span>
          </div>

          {/* موجودی */}
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4 sm:pb-5">
            <span className="shrink-0 text-sm text-slate-400">تعداد</span>

            <span className="font-bold tabular-nums text-cyan-200">
              {product.count}
            </span>
          </div>

          {/* رنگ */}
          <div className="border-b border-white/[0.07] pb-4 sm:pb-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="shrink-0 text-sm text-slate-400">رنگ</span>

              {!hasColor && (
                <span className="text-sm text-slate-500">بدون رنگ‌بندی</span>
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
                      aria-pressed={isSelected}
                      onClick={() => setSelectedColor(color)}
                      className={`
                        rounded-xl border px-4 py-2
                        text-sm font-semibold
                        transition-all duration-300
                        active:scale-95
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-cyan-400
                        focus-visible:ring-offset-2
                        focus-visible:ring-offset-[#101c31]
                        ${
                          isSelected
                            ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)]"
                            : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-400/[0.07] hover:text-cyan-100"
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
              <span className="inline-flex rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] px-4 py-2 text-sm font-semibold text-cyan-100">
                {colors[0]}
              </span>
            )}

            {hasMultipleColors && !selectedColor && (
              <p className="mt-3 text-xs text-amber-300/90">
                ابتدا رنگ موردنظر خود را انتخاب کنید.
              </p>
            )}
          </div>
        </div>

        {/* قیمت */}
        <div className="mt-8 sm:mt-10">
          <span className="text-sm font-medium text-slate-400">
            {hasValidDiscount ? "قیمت پس از تخفیف" : "قیمت"}
          </span>

          {hasValidDiscount && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300">
                ٪{Math.round((1 - discountedPrice / originalPrice) * 100)} تخفیف
              </span>

              <span className="text-sm text-slate-500 line-through">
                {originalPrice.toLocaleString("fa-IR")} تومان
              </span>
            </div>
          )}

          <p className="mt-3 break-words text-3xl font-black tabular-nums text-cyan-300 sm:text-4xl">
            {finalPrice.toLocaleString("fa-IR")} تومان
          </p>
        </div>

        {/* توضیحات */}
        <div
          className="
            mb-8 mt-8 rounded-2xl
            border border-white/[0.07]
            bg-gradient-to-br from-white/[0.055] to-white/[0.02]
            p-4 shadow-inner
            sm:mb-10 sm:mt-10 sm:p-6
          "
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />

            <span className="text-sm font-semibold text-slate-300">
              توضیحات محصول
            </span>
          </div>

          <p className="break-words text-sm leading-8 text-slate-300 sm:text-base sm:leading-9">
            {product.description || "توضیحی برای این محصول ثبت نشده است."}
          </p>
        </div>

        {/* افزودن به سبد */}
        <div className="relative">
          <AddToCartButton
            productCode={product.productCode}
            productTitle={product.title}
            productImage={product.images?.[0]}
            color={selectedColor}
            requireColor={colors.length > 0}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
