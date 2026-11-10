import { useEffect, useState } from "react";

import { getCategories, uploadProductImage } from "../../services/api";
import { optimizeImage } from "../../utils/optimizeImage";

const getInitialForm = (initialValues) => ({
  productCode: initialValues?.productCode || "",
  title: initialValues?.title || "",
  categoryId: initialValues?.categoryId ?? "",
  count: initialValues?.count ?? "",
  color: initialValues?.color || "",
  price: initialValues?.price ?? "",
  discountedPrice: initialValues?.discountedPrice ?? "",
  discountPercent: initialValues?.discountedPrice && initialValues?.price ? Math.round((1 - initialValues.discountedPrice / initialValues.price) * 100) : "",
  description: initialValues?.description || "",
  images: Array.isArray(initialValues?.images) ? initialValues.images : [],
});

const parseColors = (value) => {
  if (Array.isArray(value)) {
    return [
      ...new Set(value.map((color) => String(color).trim()).filter(Boolean)),
    ];
  }

  if (typeof value !== "string") return [];

  return [
    ...new Set(
      value
        .split(/[,،\n|]/)
        .map((color) => color.trim())
        .filter(Boolean),
    ),
  ];
};

const AdminProductForm = ({
  initialValues = null,
  onSubmit,
  submitText = "ذخیره",
  loading = false,
  saving = false,
  error = "",
  success = "",
}) => {
  const [form, setForm] = useState(() => getInitialForm(initialValues));
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [newColor, setNewColor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  // =================================================
  // دریافت دسته‌بندی‌ها
  // =================================================

  useEffect(() => {
    let ignore = false;

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        setFormError("");

        const data = await getCategories();

        if (!ignore) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Categories error:", error);

        if (!ignore) {
          setFormError("خطا در دریافت دسته‌بندی‌ها");
        }
      } finally {
        if (!ignore) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  const addColor = () => {
    const color = newColor.trim();

    if (!color) return;

    const colors = parseColors(form.color);

    if (colors.some((item) => item === color)) {
      setFormError("این رنگ قبلاً اضافه شده است.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      color: [...colors, color].join("، "),
    }));

    setNewColor("");
    setFormError("");
  };

  const removeColor = (colorToRemove) => {
    const colors = parseColors(form.color).filter(
      (color) => color !== colorToRemove,
    );

    setForm((prev) => ({
      ...prev,
      color: colors.join("، "),
    }));

    setFormError("");
  };
  // =================================================
  // تغییر فیلد
  // =================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => {
      if (name === "price") {
        const basePrice = Number(value);
        const percent = Number(prev.discountPercent);
        const discountedPrice = Number(prev.discountedPrice);

        if (
          prev.discountPercent !== "" &&
          Number.isInteger(percent) &&
          percent >= 1 &&
          percent <= 99 &&
          basePrice > 0
        ) {
          return {
            ...prev,
            price: value,
            discountedPrice: String(Math.round(basePrice * (100 - percent) / 100)),
          };
        }

        return {
          ...prev,
          price: value,
          discountPercent:
            basePrice > 0 &&
            discountedPrice > 0 &&
            discountedPrice < basePrice
              ? String(Math.round((1 - discountedPrice / basePrice) * 100))
              : "",
          discountedPrice:
            discountedPrice > 0 && discountedPrice < basePrice
              ? prev.discountedPrice
              : "",
        };
      }
      if (name === "discountPercent") {
        const percent = value === "" ? "" : Number(value);
        const basePrice = Number(prev.price);
        return { ...prev, discountPercent: value, discountedPrice: percent === "" || !Number.isInteger(percent) || percent < 1 || percent > 99 || basePrice <= 0 ? "" : String(Math.round(basePrice * (100 - percent) / 100)) };
      }
      if (name === "discountedPrice") {
        const discounted = value === "" ? "" : Number(value);
        const basePrice = Number(prev.price);
        return { ...prev, discountedPrice: value, discountPercent: discounted === "" || !Number.isInteger(discounted) || basePrice <= 0 || discounted <= 0 || discounted >= basePrice ? "" : String(Math.round((1 - discounted / basePrice) * 100)) };
      }
      return { ...prev, [name]: value };
    });

    setFormError("");
  };

  // =================================================
  // آپلود تصویر
  // =================================================

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    try {
      setUploading(true);
      setFormError("");

      const uploadedImages = [];

      for (const file of files) {
        const optimizedFile = await optimizeImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          maxBytes: 500 * 1024,
        });
        const result = await uploadProductImage(optimizedFile);

        uploadedImages.push(result.url);
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));
    } catch (error) {
      console.error("Image upload error:", error);

      setFormError(error.message || "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // =================================================
  // حذف تصویر
  // =================================================

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  // =================================================
  // Submit
  // =================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    const productCode = form.productCode.trim();
    const title = form.title.trim();
    const categoryId = Number(form.categoryId);
    const count = Number(form.count);
    const price = Number(form.price);
    const discountedPrice = form.discountedPrice === "" ? null : Number(form.discountedPrice);

    if (!productCode) {
      setFormError("کد محصول الزامی است.");
      return;
    }

    if (!title) {
      setFormError("عنوان محصول الزامی است.");
      return;
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setFormError("دسته‌بندی محصول را انتخاب کنید.");
      return;
    }

    if (!Number.isInteger(count) || count < 0) {
      setFormError("موجودی محصول نامعتبر است.");
      return;
    }

    if (!Number.isSafeInteger(price) || price < 1) {
      setFormError("قیمت محصول نامعتبر است.");
      return;
    }

    if (discountedPrice !== null && (!Number.isSafeInteger(discountedPrice) || discountedPrice <= 0 || discountedPrice >= price)) {
      setFormError("قیمت تخفیف‌خورده باید عدد صحیح و کمتر از قیمت اصلی باشد.");
      return;
    }

    const data = {
      productCode,
      title,
      categoryId,
      count,
      color: form.color.trim() || null,
      price,
      discountedPrice,
      description: form.description.trim() || null,
      images: form.images.filter(Boolean),
    };

    try {
      await onSubmit(data);
    } catch (error) {
      setFormError(error.message || "خطا در ذخیره محصول");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
        max-w-4xl
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-5
        sm:p-8
      "
    >
      {error && (
        <div
          className="
          mb-6 rounded-xl
          border border-red-900/50
          bg-red-950/30
          p-4 text-sm text-red-400
        "
        >
          {error}
        </div>
      )}

      {formError && (
        <div
          className="
          mb-6 rounded-xl
          border border-red-900/50
          bg-red-950/30
          p-4 text-sm text-red-400
        "
        >
          {formError}
        </div>
      )}

      {success && (
        <div
          className="
          mb-6 rounded-xl
          border border-emerald-900/50
          bg-emerald-950/30
          p-4 text-sm text-emerald-400
        "
        >
          {success}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* کد محصول */}

        <div>
          <label className="mb-2 block text-sm text-zinc-300">کد محصول</label>

          <input
            name="productCode"
            value={form.productCode}
            onChange={handleChange}
            disabled={Boolean(initialValues?.productCode)}
            required
            className="
              w-full rounded-xl
              border border-zinc-700
              bg-zinc-950
              px-4 py-3
              text-white
              outline-none
              focus:border-zinc-400
              disabled:bg-zinc-800
              disabled:text-zinc-500
            "
          />
        </div>

        {/* عنوان */}

        <div>
          <label className="mb-2 block text-sm text-zinc-300">عنوان</label>

          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="
              w-full rounded-xl
              border border-zinc-700
              bg-zinc-950
              px-4 py-3
              text-white
              outline-none
              focus:border-zinc-400
            "
          />
        </div>

        {/* دسته‌بندی */}

        <div>
          <label className="mb-2 block text-sm text-zinc-300">دسته‌بندی</label>

          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            required
            disabled={categoriesLoading}
            className="
              w-full rounded-xl
              border border-zinc-700
              bg-zinc-950
              px-4 py-3
              text-white
              outline-none
              focus:border-zinc-400
              disabled:opacity-50
            "
          >
            <option value="">
              {categoriesLoading
                ? "در حال دریافت دسته‌بندی‌ها..."
                : "انتخاب دسته‌بندی"}
            </option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* موجودی */}

        <div>
          <label className="mb-2 block text-sm text-zinc-300">موجودی</label>

          <input
            name="count"
            type="number"
            min="0"
            value={form.count}
            onChange={handleChange}
            required
            className="
              w-full rounded-xl
              border border-zinc-700
              bg-zinc-950
              px-4 py-3
              text-white
              outline-none
              focus:border-zinc-400
            "
          />
        </div>
        {/* رنگ‌های محصول */}

        <div>
          <label className="mb-2 block text-sm text-zinc-300">
            رنگ‌های محصول
          </label>

          <div className="flex gap-2">
            <input
              value={newColor}
              onChange={(event) => setNewColor(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addColor();
                }
              }}
              placeholder="مثلاً مشکی"
              className="
        min-w-0 flex-1 rounded-xl
        border border-zinc-700
        bg-zinc-950 px-4 py-3
        text-white outline-none
        focus:border-zinc-400
      "
            />

            <button
              type="button"
              onClick={addColor}
              className="
        rounded-xl bg-zinc-700
        px-4 py-3 text-sm font-bold
        text-white transition
        hover:bg-zinc-600
      "
            >
              افزودن
            </button>
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            هر رنگ را جداگانه اضافه کن.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {parseColors(form.color).map((color) => (
              <span
                key={color}
                className="
          inline-flex items-center gap-2
          rounded-lg border border-zinc-700
          bg-zinc-800 px-3 py-2
          text-sm text-zinc-200
        "
              >
                {color}

                <button
                  type="button"
                  onClick={() => removeColor(color)}
                  aria-label={`حذف رنگ ${color}`}
                  className="font-bold text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))}

            {parseColors(form.color).length === 0 && (
              <span className="text-sm text-zinc-500">
                هنوز رنگی اضافه نشده است.
              </span>
            )}
          </div>
        </div>

        {/* قیمت اصلی و تخفیف */}
        <div>
          <label className="mb-2 block text-sm text-zinc-300">قیمت اصلی (تومان)</label>
          <input name="price" type="number" min="1" step="1" value={form.price} onChange={handleChange} required className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-400" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-300">درصد تخفیف</label>
          <input name="discountPercent" type="number" min="1" max="99" step="1" value={form.discountPercent} onChange={handleChange} placeholder="بدون تخفیف خالی بماند" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-400" />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-300">قیمت پس از تخفیف (تومان)</label>
          <input name="discountedPrice" type="number" min="1" step="1" value={form.discountedPrice} onChange={handleChange} placeholder="یا قیمت نهایی را وارد کنید" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-400" />
          <p className="mt-2 text-xs text-zinc-500">با وارد کردن درصد یا قیمت نهایی، مقدار دیگر محاسبه می‌شود. برای حذف تخفیف هر دو فیلد را خالی کنید.</p>
        </div>

        {/* توضیحات */}

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm text-zinc-300">توضیحات</label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            className="
              w-full resize-y
              rounded-xl
              border border-zinc-700
              bg-zinc-950
              px-4 py-3
              text-white
              outline-none
              focus:border-zinc-400
            "
          />
        </div>

        {/* تصاویر */}

        <div className="md:col-span-2">
          <div className="mb-3">
            <label className="mb-2 block text-sm text-zinc-300">
              تصاویر محصول
            </label>

            <p className="text-xs text-zinc-500">
              JPG، PNG، WEBP و AVIF تا 5MB
            </p>
          </div>

          <label
            className="
              flex cursor-pointer
              items-center justify-center
              rounded-xl
              border border-dashed
              border-zinc-700
              bg-zinc-950
              px-4 py-6
              text-sm text-zinc-400
              transition
              hover:border-zinc-500
            "
          >
            {uploading ? "در حال آپلود..." : "انتخاب تصویر از کامپیوتر"}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              disabled={uploading}
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {form.images.length > 0 && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {form.images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="
                    relative overflow-hidden
                    rounded-2xl
                    border border-zinc-800
                    bg-zinc-950
                  "
                >
                  <img
                    src={image}
                    alt={`تصویر ${index + 1}`}
                    className="
                      h-48 w-full
                      bg-zinc-900
                      object-contain p-2
                    "
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="
                      absolute right-2 top-2
                      rounded-lg
                      bg-red-950/90
                      px-3 py-2
                      text-xs text-red-300
                      transition
                      hover:bg-red-900
                    "
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={loading || saving || uploading || categoriesLoading}
          className="
            rounded-xl
            bg-white
            px-6 py-3
            font-bold
            text-zinc-900
            transition
            hover:bg-zinc-200
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {saving ? "در حال ذخیره..." : submitText}
        </button>
      </div>
    </form>
  );
};

export default AdminProductForm;
