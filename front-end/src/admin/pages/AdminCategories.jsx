import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  createCategory,
  getCategories,
  uploadProductImage,
} from "../../services/api";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =================================================
  // دریافت Categories
  // =================================================

  useEffect(() => {
    let ignore = false;

    const loadCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCategories();

        if (!ignore) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Categories error:", error);

        if (!ignore) {
          setError("خطا در دریافت دسته‌بندی‌ها");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      ignore = true;
    };
  }, []);

  // =================================================
  // آپلود تصویر Category
  // =================================================

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const result = await uploadProductImage(file);

      setImage(result.url);

      setSuccess("تصویر دسته‌بندی آپلود شد.");
    } catch (error) {
      console.error("Category image upload error:", error);

      setError(error.message || "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // =================================================
  // ساخت Category
  // =================================================

  const handleCreate = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("نام دسته‌بندی الزامی است.");

      return;
    }

    if (!image) {
      setError("برای دسته‌بندی تصویر انتخاب کنید.");

      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const slug = trimmedName.toLowerCase().replace(/\s+/g, "-");

      const category = await createCategory({
        name: trimmedName,
        slug,
        image,
      });

      setCategories((prev) => [...prev, category]);

      setName("");
      setImage("");

      setSuccess("دسته‌بندی با موفقیت ایجاد شد.");
    } catch (error) {
      console.error("Create category error:", error);

      setError(error.message || "خطا در ایجاد دسته‌بندی");
    } finally {
      setCreating(false);
    }
  };

  // =================================================
  // Loading
  // =================================================

  if (loading) {
    return (
      <div className="py-10 text-center text-zinc-400">
        در حال دریافت دسته‌بندی‌ها...
      </div>
    );
  }

  // =================================================
  // UI
  // =================================================

  return (
    <div dir="rtl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">دسته‌بندی‌ها</h2>

        <p className="mt-2 text-sm text-zinc-400">
          مدیریت دسته‌بندی و برند محصولات
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* ================================================= */}
      {/* Create Category */}
      {/* ================================================= */}

      <form
        onSubmit={handleCreate}
        className="
          mb-8
          max-w-4xl
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-900
          p-5
          sm:p-8
        "
      >
        <h3 className="mb-5 text-lg font-bold">ایجاد دسته‌بندی جدید</h3>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Name */}

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              نام دسته‌بندی
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثلاً Samsonite"
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
                focus:border-zinc-400
              "
            />
          </div>

          {/* Image */}

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              تصویر دسته‌بندی
            </label>

            <label
              className="
                flex
                cursor-pointer
                items-center
                justify-center
                rounded-xl
                border
                border-dashed
                border-zinc-700
                bg-zinc-950
                px-4
                py-3
                text-sm
                text-zinc-400
                transition
                hover:border-zinc-500
              "
            >
              {uploading ? "در حال آپلود..." : "انتخاب تصویر از کامپیوتر"}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={uploading}
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Preview */}

        {image && (
          <div className="mt-5">
            <img
              src={image}
              alt={name || "Category preview"}
              className="
                h-40
                w-full
                rounded-xl
                bg-zinc-950
                object-contain
                p-3
              "
            />
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={creating || uploading}
            className="
              rounded-xl
              bg-white
              px-6
              py-3
              font-bold
              text-zinc-900
              transition
              hover:bg-zinc-200
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {creating ? "در حال ایجاد..." : "ایجاد دسته‌بندی"}
          </button>
        </div>
      </form>

      {/* ================================================= */}
      {/* Categories */}
      {/* ================================================= */}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/admin/categories/${category.slug}`}
            className="
              group
              overflow-hidden
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-900
              transition
              hover:-translate-y-1
              hover:border-zinc-600
            "
          >
            {category.image && (
              <img
                src={category.image}
                alt={category.name}
                className="
                  h-40
                  w-full
                  bg-zinc-950
                  object-contain
                  p-4
                  transition
                  group-hover:scale-105
                "
              />
            )}

            <div className="p-4">
              <h3 className="font-bold text-white">{category.name}</h3>

              <p className="mt-1 text-sm text-zinc-500">مشاهده محصولات</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminCategories;
