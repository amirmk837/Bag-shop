import { useCallback, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emptyForm = {
  name: "",
  price: "",
  description: "",
};

export default function AdminShippingMethods() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "درخواست ناموفق بود.");
    }

    return data;
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await request("/admin/shipping-methods");
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "خطا در دریافت روش‌های ارسال.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const price = Number(form.price);

    if (!form.name.trim()) {
      setError("نام روش ارسال را وارد کن.");
      return;
    }

    if (!Number.isSafeInteger(price) || price < 0) {
      setError("هزینه ارسال باید عدد صحیح نامنفی به تومان باشد.");
      return;
    }

    setSaving(true);

    try {
      const editing = editingId !== null;
      const path = editing
        ? `/admin/shipping-methods/${editingId}`
        : "/admin/shipping-methods";

      await request(path, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          price,
          description: form.description.trim(),
        }),
      });

      setForm(emptyForm);
      setEditingId(null);
      setMessage(editing ? "روش ارسال ویرایش شد." : "روش ارسال اضافه شد.");
      await loadItems();
    } catch (err) {
      setError(err.message || "ذخیره روش ارسال ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      price: String(item.price),
      description: item.description || "",
    });
    setMessage("");
    setError("");
  };

  const toggleActive = async (item) => {
    setError("");
    setMessage("");

    try {
      await request(`/admin/shipping-methods/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !item.isActive }),
      });

      setMessage("وضعیت روش ارسال تغییر کرد.");
      await loadItems();
    } catch (err) {
      setError(err.message || "تغییر وضعیت ناموفق بود.");
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`روش ارسال «${item.name}» حذف شود؟`)) return;

    setError("");
    setMessage("");

    try {
      await request(`/admin/shipping-methods/${item.id}`, {
        method: "DELETE",
      });

      setMessage("روش ارسال حذف شد.");
      if (editingId === item.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await loadItems();
    } catch (err) {
      setError(err.message || "حذف روش ارسال ناموفق بود.");
    }
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6 p-4 text-white sm:p-6">
      <h1 className="text-2xl font-bold">مدیریت روش‌های ارسال</h1>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-white/10 bg-zinc-900 p-5 sm:grid-cols-2"
      >
        <h2 className="font-bold sm:col-span-2">
          {editingId !== null ? "ویرایش روش ارسال" : "افزودن روش ارسال"}
        </h2>

        <input
          className="rounded-lg border border-white/15 bg-zinc-800 p-3"
          placeholder="نام روش ارسال؛ مثلاً پست"
          maxLength={100}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          className="rounded-lg border border-white/15 bg-zinc-800 p-3"
          type="number"
          min="0"
          step="1"
          placeholder="هزینه به تومان"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />

        <input
          className="rounded-lg border border-white/15 bg-zinc-800 p-3 sm:col-span-2"
          placeholder="توضیحات (اختیاری)"
          maxLength={500}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            disabled={saving}
            className="rounded-lg bg-cyan-700 px-5 py-3 font-bold disabled:opacity-50"
          >
            {saving
              ? "در حال ذخیره..."
              : editingId !== null
                ? "ذخیره تغییرات"
                : "افزودن روش"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded-lg bg-zinc-700 px-5 py-3"
            >
              انصراف
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="rounded-lg bg-red-950 p-3 text-red-300">{error}</p>
      )}
      {message && (
        <p className="rounded-lg bg-green-950 p-3 text-green-300">{message}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        {loading ? (
          <p className="p-5">در حال دریافت روش‌های ارسال...</p>
        ) : items.length === 0 ? (
          <p className="p-5">هنوز روش ارسالی ثبت نشده است.</p>
        ) : (
          <table className="w-full min-w-[650px] text-right">
            <thead className="bg-zinc-800">
              <tr>
                <th className="p-3">نام</th>
                <th className="p-3">هزینه (تومان)</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-white/10">
                  <td className="p-3">
                    <div>{item.name}</div>
                    {item.description && (
                      <div className="mt-1 text-sm text-zinc-400">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="p-3">{item.price.toLocaleString("fa-IR")}</td>
                  <td className="p-3">{item.isActive ? "فعال" : "غیرفعال"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded bg-blue-800 px-3 py-2"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => toggleActive(item)}
                        className="rounded bg-amber-800 px-3 py-2"
                      >
                        {item.isActive ? "غیرفعال‌کردن" : "فعال‌کردن"}
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        className="rounded bg-red-900 px-3 py-2"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
