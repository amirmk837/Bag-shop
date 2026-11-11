import { useEffect, useState } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiX,
} from "react-icons/fi";

import {
  getAdminFooterTrustBadges,
  createFooterTrustBadge,
  updateFooterTrustBadge,
  deleteFooterTrustBadge,
} from "../../../../back-end/src/services/footerTrustBadgeApi";

const initialForm = {
  title: "",
  altText: "",
  linkUrl: "",
  sortOrder: 0,
  isActive: true,
  image: null,
};

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const imageUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url}`;
};

const AdminFooterTrustBadges = () => {
  const [badges, setBadges] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBadges = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminFooterTrustBadges();
      setBadges(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setError("");
    setMessage("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];

    if (!allowed.includes(file.type)) {
      setError("فرمت تصویر باید JPG، PNG، WEBP یا AVIF باشد.");
      event.target.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("حجم تصویر نباید بیشتر از ۳ مگابایت باشد.");
      event.target.value = "";
      return;
    }

    setError("");
    setForm((current) => ({ ...current, image: file }));
  };

  const handleEdit = (badge) => {
    setEditingId(badge.id);

    setForm({
      title: badge.title,
      altText: badge.altText,
      linkUrl: badge.linkUrl || "",
      sortOrder: badge.sortOrder,
      isActive: badge.isActive,
      image: null,
    });

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.altText.trim()) {
      setError("عنوان و متن جایگزین تصویر الزامی هستند.");
      return;
    }

    if (!editingId && !form.image) {
      setError("برای نماد جدید باید تصویر انتخاب کنی.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const values = {
        ...form,
        sortOrder: Number(form.sortOrder),
      };

      if (editingId) {
        await updateFooterTrustBadge(editingId, values);
        setMessage("نماد اعتماد ویرایش شد.");
      } else {
        await createFooterTrustBadge(values);
        setMessage("نماد اعتماد اضافه شد.");
      }

      resetForm();
      await loadBadges();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (badge) => {
    try {
      setError("");
      await updateFooterTrustBadge(badge.id, {
        isActive: !badge.isActive,
      });
      await loadBadges();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (badge) => {
    const confirmed = window.confirm(`نماد «${badge.title}» حذف شود؟`);

    if (!confirmed) return;

    try {
      setError("");
      await deleteFooterTrustBadge(badge.id);

      if (editingId === badge.id) resetForm();

      setMessage("نماد اعتماد حذف شد.");
      await loadBadges();
    } catch (err) {
      setError(err.message);
    }
  };

  const preview = form.image
    ? URL.createObjectURL(form.image)
    : editingId
      ? imageUrl(badges.find((item) => item.id === editingId)?.imageUrl)
      : "";

  return (
    <main dir="rtl" className="space-y-6 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">مدیریت نمادهای اعتماد</h1>
          <p className="mt-2 text-sm text-zinc-400">
            نمادها و مجوزهایی که در فوتر فروشگاه نمایش داده می‌شوند را مدیریت
            کن.
          </p>
        </div>

        <button
          type="button"
          onClick={loadBadges}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm hover:bg-zinc-800 disabled:opacity-50"
        >
          <FiRefreshCw />
          تازه‌سازی
        </button>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-950/40 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded-xl bg-emerald-950/40 p-3 text-sm text-emerald-300"
        >
          {message}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            {editingId ? "ویرایش نماد" : "افزودن نماد جدید"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              <FiX />
              انصراف از ویرایش
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-sm text-zinc-300">عنوان نماد</span>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={100}
              required
              placeholder="مثلاً نماد اعتماد الکترونیکی"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-sm text-zinc-300">
              متن جایگزین تصویر (Alt)
            </span>
            <input
              name="altText"
              value={form.altText}
              onChange={handleChange}
              maxLength={180}
              required
              placeholder="توضیح کوتاه تصویر"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="block text-sm text-zinc-300">
            لینک مقصد (اختیاری)
          </span>
          <input
            name="linkUrl"
            value={form.linkUrl}
            onChange={handleChange}
            maxLength={2048}
            dir="ltr"
            placeholder="https://example.com"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-left outline-none focus:border-cyan-500"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="block text-sm text-zinc-300">ترتیب نمایش</span>
            <input
              type="number"
              name="sortOrder"
              value={form.sortOrder}
              onChange={handleChange}
              min="0"
              max="100000"
              step="1"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </label>

          <label className="flex items-center gap-3 self-end rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4 accent-cyan-500"
            />
            نمایش نماد در فوتر
          </label>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm font-semibold text-zinc-300">تصویر نماد</p>
          <p className="mt-1 text-xs text-zinc-500">
            JPG، PNG، WEBP یا AVIF — حداکثر ۳ مگابایت
          </p>

          {preview && (
            <img
              src={preview}
              alt={form.altText || "پیش‌نمایش نماد"}
              className="my-4 h-24 max-w-48 object-contain"
            />
          )}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleImage}
            className="mt-3 block w-full text-sm text-zinc-400"
          />

          {editingId && (
            <p className="mt-2 text-xs text-zinc-500">
              اگر تصویر جدید انتخاب نکنی، تصویر فعلی حفظ می‌شود.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          {editingId ? <FiSave /> : <FiPlus />}
          {saving
            ? "در حال ذخیره..."
            : editingId
              ? "ذخیره تغییرات"
              : "افزودن نماد"}
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">فهرست نمادها</h2>

        {loading ? (
          <p className="py-8 text-center text-zinc-400">
            در حال دریافت اطلاعات...
          </p>
        ) : badges.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-400">
            هنوز نمادی ثبت نشده است.
          </p>
        ) : (
          <div className="space-y-3">
            {badges.map((badge) => (
              <article
                key={badge.id}
                className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl bg-zinc-950 p-2">
                  <img
                    src={imageUrl(badge.imageUrl)}
                    alt={badge.altText}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{badge.title}</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    ترتیب نمایش: {badge.sortOrder.toLocaleString("fa-IR")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {badge.linkUrl || "بدون لینک مقصد"}
                  </p>
                  <p
                    className={`mt-2 text-xs ${badge.isActive ? "text-emerald-400" : "text-zinc-500"}`}
                  >
                    {badge.isActive ? "فعال و قابل نمایش" : "غیرفعال"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(badge)}
                    title={badge.isActive ? "غیرفعال‌کردن" : "فعال‌کردن"}
                    className="rounded-lg border border-zinc-700 p-3 text-zinc-300 hover:bg-zinc-800"
                  >
                    {badge.isActive ? <FiEyeOff /> : <FiEye />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(badge)}
                    title="ویرایش"
                    className="rounded-lg border border-zinc-700 p-3 text-cyan-300 hover:bg-zinc-800"
                  >
                    <FiEdit2 />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(badge)}
                    title="حذف"
                    className="rounded-lg border border-red-900/60 p-3 text-red-400 hover:bg-red-950/40"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminFooterTrustBadges;
