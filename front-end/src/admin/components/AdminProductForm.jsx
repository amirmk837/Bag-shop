import { useEffect, useState } from "react";

import { getCategories, uploadProductImage } from "../../services/api";

const getInitialForm = (initialValues) => ({
  productCode: initialValues?.productCode || "",
  title: initialValues?.title || "",
  categoryId: initialValues?.categoryId ?? "",
  count: initialValues?.count ?? "",
  color: initialValues?.color || "",
  price: initialValues?.price ?? "",
  description: initialValues?.description || "",
  images: Array.isArray(initialValues?.images) ? initialValues.images : [],
});

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

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // =================================================
  // دریافت دسته‌بندی‌ها
  // =================================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();

        setCategories(data);
      } catch (error) {
        console.error("Categories error:", error);

        setUploadError("خطا در دریافت دسته‌بندی‌ها");
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  // =================================================
  // تغییر فیلد
  // =================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      setUploadError("");

      const uploadedImages = [];

      for (const file of files) {
        const result = await uploadProductImage(file);

        uploadedImages.push(result.url);
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));
    } catch (error) {
      console.error("Image upload error:", error);

      setUploadError(error.message || "خطا در آپلود تصویر");
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

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      productCode: form.productCode.trim(),

      title: form.title.trim(),

      categoryId: Number(form.categoryId),

      count: Number(form.count),

      color: form.color.trim() || null,

      price: Number(form.price),

      description: form.description.trim() || null,

      images: form.images.filter(Boolean),
    });
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
        <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {uploadError && (
        <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          {uploadError}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm text-emerald-400">
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
              w-full
              rounded-xl
              border
              border-zinc-700
              bg-zinc-950
              px-4
              py-3
              text-white
              outline-none
              disabled:bg-zinc-800
              disabled:text-zinc-500
              focus:border-zinc-400
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
              w-full rounded-xl border
              border-zinc-700 bg-zinc-950
              px-4 py-3 text-white
              outline-none focus:border-zinc-400
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
              w-full rounded-xl border
              border-zinc-700 bg-zinc-950
              px-4 py-3 text-white
              outline-none focus:border-zinc-400
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
              w-full rounded-xl border
              border-zinc-700 bg-zinc-950
              px-4 py-3 text-white
              outline-none focus:border-zinc-400
            "
          />
        </div>

        {/* رنگ */}

        <div>
          <label className="mb-2 block text-sm text-zinc-300">رنگ</label>

          <input
            name="color"
            value={form.color}
            onChange={handleChange}
            className="
              w-full rounded-xl border
              border-zinc-700 bg-zinc-950
              px-4 py-3 text-white
              outline-none focus:border-zinc-400
            "
          />
        </div>

        {/* قیمت */}

        <div>
          <label className="mb-2 block text-sm text-zinc-300">قیمت</label>

          <input
            name="price"
            type="number"
            min="0"
            value={form.price}
            onChange={handleChange}
            required
            className="
              w-full rounded-xl border
              border-zinc-700 bg-zinc-950
              px-4 py-3 text-white
              outline-none focus:border-zinc-400
            "
          />
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
              w-full resize-y rounded-xl border
              border-zinc-700 bg-zinc-950
              px-4 py-3 text-white
              outline-none focus:border-zinc-400
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
              rounded-xl border border-dashed
              border-zinc-700
              bg-zinc-950
              px-4 py-6
              text-sm text-zinc-400
              transition hover:border-zinc-500
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
                      rounded-2xl border
                      border-zinc-800
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
          disabled={loading || saving || uploading}
          className="
            rounded-xl bg-white
            px-6 py-3
            font-bold text-zinc-900
            transition hover:bg-zinc-200
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {submitText}
        </button>
      </div>
    </form>
  );
};

export default AdminProductForm;
