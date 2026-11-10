import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FeedbackDialog from "../components/ui/FeedbackDialog";

import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  uploadProductImage,
} from "../../services/api";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    image: "",
    parentId: "",
    sortOrder: "0",
  });
  const [dialog, setDialog] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
    confirmText: "تأیید",
    cancelText: "انصراف",
    onConfirm: null,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const closeDialog = () => {
    setDialog((prev) => ({
      ...prev,
      open: false,
      onConfirm: null,
    }));
  };

  const showError = (message, title = "خطا") => {
    setDialog({
      open: true,
      type: "error",
      title,
      message,
      confirmText: "متوجه شدم",
      cancelText: "انصراف",
      onConfirm: null,
    });
  };

  const showConfirm = ({
    title,
    message,
    confirmText = "حذف",
    cancelText = "انصراف",
    onConfirm,
  }) => {
    setDialog({
      open: true,
      type: "confirm",
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
    });
  };
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
  // آپلود تصویر برای ایجاد
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
  // آپلود تصویر برای ویرایش
  // =================================================

  const handleEditImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const result = await uploadProductImage(file);

      setEditForm((prev) => ({
        ...prev,
        image: result.url,
      }));

      setSuccess("تصویر جدید آپلود شد.");
    } catch (error) {
      console.error("Edit category image upload error:", error);

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

    if (!image && !parentId) {
      setError("برای دسته‌بندی مادر تصویر انتخاب کنید.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const slug = trimmedName.toLowerCase().replace(/\s+/g, "-");

      await createCategory({name:trimmedName,slug,image:image||null,parentId:parentId?Number(parentId):null,sortOrder:Number(sortOrder)||0});
      setCategories(await getCategories());

      setName("");
      setImage("");
      setParentId("");
      setSortOrder("0");

      setSuccess("دسته‌بندی با موفقیت ایجاد شد.");
    } catch (error) {
      console.error("Create category error:", error);

      setError(error.message || "خطا در ایجاد دسته‌بندی");
    } finally {
      setCreating(false);
    }
  };

  // =================================================
  // شروع ویرایش
  // =================================================

  const handleEditStart = (category) => {
    setEditingCategory(category);

    setEditForm({
      name: category.name || "",
      slug: category.slug || "",
      image: category.image || "",
      parentId: category.parentId ? String(category.parentId) : "",
      sortOrder: String(category.sortOrder ?? 0),
    });

    setError("");
    setSuccess("");
  };

  // =================================================
  // تغییر فیلد ویرایش
  // =================================================

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =================================================
  // ذخیره ویرایش
  // =================================================

  const handleEditSave = async (event) => {
    event.preventDefault();

    const trimmedName = editForm.name.trim();
    const trimmedSlug = editForm.slug.trim();

    if (!trimmedName) {
      setError("نام دسته‌بندی الزامی است.");
      return;
    }

    if (!trimmedSlug) {
      setError("slug دسته‌بندی الزامی است.");
      return;
    }

    if (!editForm.image && !editForm.parentId) {
      setError("برای دسته‌بندی مادر تصویر انتخاب کنید.");
      return;
    }

    try {
      setSavingEdit(true);
      setError("");
      setSuccess("");

      await updateCategory(editingCategory.id,{name:trimmedName,slug:trimmedSlug,image:editForm.image||null,parentId:editForm.parentId?Number(editForm.parentId):null,sortOrder:Number(editForm.sortOrder)||0});
      setCategories(await getCategories());

      setEditingCategory(null);

      setSuccess("دسته‌بندی با موفقیت ویرایش شد.");
    } catch (error) {
      console.error("Update category error:", error);

      setError(error.message || "خطا در ویرایش دسته‌بندی");
    } finally {
      setSavingEdit(false);
    }
  };

  // =================================================
  // لغو ویرایش
  // =================================================

  const handleEditCancel = () => {
    setEditingCategory(null);
    setError("");
  };

  // =================================================
  // حذف Category
  // =================================================

  const handleDelete = async (category) => {
    if (category.children?.length) {
      showError("این گروه زیرمجموعه دارد. ابتدا زیرمجموعه‌ها را به گروه دیگری منتقل کنید.");
      return;
    }
    try {
      setDeletingCategoryId(category.id);

      await deleteCategory(category.id);

      setCategories((prev) => prev.filter((item) => item.id !== category.id));

      setSuccess("دسته‌بندی با موفقیت حذف شد.");
      setDeletingCategoryId(null);
    } catch (error) {
      console.error("Delete category error:", error);

      if (error.status === 409 && typeof error.productCount === "number") {
        const productCount = error.productCount;

        const message =
          productCount === 0
            ? `آیا می‌خواهید دسته‌بندی «${category.name}» حذف شود؟`
            : `این دسته‌بندی ${productCount} محصول دارد.\n\n` +
              `با حذف آن، تمام محصولات این دسته‌بندی نیز حذف خواهند شد.\n\n` +
              `آیا مطمئن هستید؟`;

        showConfirm({
          title:
            productCount === 0 ? "حذف دسته‌بندی" : "حذف دسته‌بندی و محصولات",

          message,

          confirmText: "حذف",
          cancelText: "انصراف",

          onConfirm: async () => {
            try {
              await deleteCategory(category.id, true);

              setCategories((prev) =>
                prev.filter((item) => item.id !== category.id),
              );

              setSuccess(
                productCount === 0
                  ? "دسته‌بندی با موفقیت حذف شد."
                  : `دسته‌بندی و ${productCount} محصول آن حذف شدند.`,
              );

              setDeletingCategoryId(null);

              return true;
            } catch (deleteError) {
              console.error("Force delete category error:", deleteError);

              setDeletingCategoryId(null);

              showError(
                deleteError.message || "خطا در حذف دسته‌بندی و محصولات",
                "خطا در حذف",
              );

              return false;
            }
          },
        });

        return;
      }

      setDeletingCategoryId(null);

      showError(
        error.message || "خطا در حذف دسته‌بندی",
        "خطا در حذف دسته‌بندی",
      );
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

          <div>
            <label className="mb-2 block text-sm text-zinc-300">ترتیب نمایش</label>
            <input type="number" min="0" max="10000" value={sortOrder} onChange={e=>setSortOrder(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"/>
            <label className="mb-2 mt-4 block text-sm text-zinc-300">دسته‌بندی مادر</label>
            <select value={parentId} onChange={e=>setParentId(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"><option value="">بدون والد (گروه اصلی)</option>{categories.filter(item=>!item.parentId).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
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
      {/* Edit Category */}
      {/* ================================================= */}

      {editingCategory && (
        <form
          onSubmit={handleEditSave}
          className="
            mb-8
            max-w-4xl
            rounded-2xl
            border
            border-zinc-700
            bg-zinc-900
            p-5
            sm:p-8
          "
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold">ویرایش دسته‌بندی</h3>

            <p className="mt-2 text-sm text-zinc-500">{editingCategory.name}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Name */}

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                نام دسته‌بندی
              </label>

              <input
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
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

            {/* Slug */}

            <div>
              <label className="mb-2 block text-sm text-zinc-300">Slug</label>

              <input
                name="slug"
                value={editForm.slug}
                onChange={handleEditChange}
                required
                dir="ltr"
                className="
                  w-full
                  rounded-xl
                  border
                  border-zinc-700
                  bg-zinc-950
                  px-4
                  py-3
                  text-left
                  text-white
                  outline-none
                  focus:border-zinc-400
                "
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm text-zinc-300">ترتیب نمایش</label>
            <input name="sortOrder" type="number" min="0" max="10000" value={editForm.sortOrder} onChange={handleEditChange} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"/>
            <label className="mb-2 mt-4 block text-sm text-zinc-300">دسته‌بندی مادر</label>
            <select name="parentId" value={editForm.parentId} onChange={handleEditChange} disabled={Boolean(editingCategory?.children?.length)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white disabled:opacity-50"><option value="">بدون والد (گروه اصلی)</option>{categories.filter(item=>!item.parentId&&item.id!==editingCategory?.id).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
          </div>
          {/* Image */}
          <div className="mt-5">
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
              {uploading ? "در حال آپلود..." : "انتخاب تصویر جدید"}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={uploading}
                onChange={handleEditImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {editForm.image && (
            <div className="mt-5">
              <img
                src={editForm.image}
                alt={editForm.name || "Category preview"}
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

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleEditCancel}
              disabled={savingEdit}
              className="
                rounded-xl
                border
                border-zinc-700
                px-6
                py-3
                font-bold
                text-zinc-300
                transition
                hover:bg-zinc-800
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={savingEdit || uploading}
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
              {savingEdit ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        </form>
      )}

      {/* ================================================= */}
      {/* Categories */}
      {/* ================================================= */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {categories.map((category) => (
          <div
            key={category.id}
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
            <Link to={`/admin/categories/${category.slug}`} className="block">
              {category.image && (
                <img
                  src={category.image}
                  alt={category.name}
                  className="
                    h-40
                    w-full
                    bg-zinc-900
                    border
                    border-black
                    object-contain
                    p-4
                    transition
                    group-hover:scale-105
                    rounded-2xl
                  "
                />
              )}

              <div className="p-4">
                <h3 className="font-bold text-white">{category.name}</h3>
                {category.parent?.name && <p className="mt-1 text-xs text-cyan-300/70">{category.parent.name}</p>}
                <p className="mt-1 text-sm text-zinc-500">مشاهده محصولات</p>
              </div>
            </Link>

            <div className="border-t border-zinc-800 p-4">
              <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 p-4">
                <button
                  type="button"
                  onClick={() => handleEditStart(category)}
                  disabled={deletingCategoryId === category.id}
                  className=" rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ویرایش
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(category)}
                  disabled={deletingCategoryId === category.id}
                  className="
      rounded-xl
      border
      border-red-900/60
      px-4
      py-2.5
      text-sm
      font-bold
      text-red-400
      transition
      hover:bg-red-950/40
      hover:text-red-300
      disabled:cursor-not-allowed
      disabled:opacity-50
    "
                >
                  {deletingCategoryId === category.id ? "در حال حذف..." : "حذف"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <FeedbackDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        onConfirm={dialog.onConfirm}
        onClose={closeDialog}
      />
    </div>
  );
};

export default AdminCategories;
