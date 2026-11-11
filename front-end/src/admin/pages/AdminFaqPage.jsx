import { useEffect, useState } from "react";
import { FiEdit2, FiPlus, FiRefreshCw, FiSave, FiTrash2, FiX } from "react-icons/fi";
import { createFaq, deleteFaq, getAdminFaq, updateFaq } from "../../services/faqApi";

const emptyForm = {
  question: "",
  answer: "",
  linkText: "",
  linkUrl: "",
  sortOrder: 0,
  isActive: true,
};

const inputClass = "w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10";
const labelClass = "block space-y-2 text-sm text-zinc-300";

export default function AdminFaqPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminFaq();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
  };

  const change = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setError("");
    setMessage("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (Boolean(form.linkText.trim()) !== Boolean(form.linkUrl.trim())) {
      setError("برای لینک اختیاری، هم متن و هم آدرس را وارد کن.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    const payload = {
      question: form.question,
      answer: form.answer,
      linkText: form.linkText,
      linkUrl: form.linkUrl,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    };
    try {
      if (editingId) {
        await updateFaq(editingId, payload);
        setMessage("پرسش متداول ویرایش شد.");
      } else {
        await createFaq(payload);
        setMessage("پرسش متداول اضافه شد.");
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({
      question: item.question,
      answer: item.answer,
      linkText: item.linkText || "",
      linkUrl: item.linkUrl || "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = async (item) => {
    try {
      setError("");
      await updateFaq(item.id, {
        question: item.question,
        answer: item.answer,
        linkText: item.linkText || "",
        linkUrl: item.linkUrl || "",
        sortOrder: item.sortOrder,
        isActive: !item.isActive,
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`پرسش «${item.question}» حذف شود؟ این کار قابل بازگشت نیست.`)) return;
    try {
      setError("");
      await deleteFaq(item.id);
      if (editingId === item.id) reset();
      setMessage("پرسش متداول حذف شد.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main dir="rtl" className="space-y-6 text-white">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">مدیریت پرسش‌های متداول</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
            پرسش‌ها و پاسخ‌های راهنمای مشتری را مدیریت و مرتب کن. فقط موارد فعال در صفحه عمومی نمایش داده می‌شوند.
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading || saving} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50">
          <FiRefreshCw /> تازه‌سازی
        </button>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-900/40 bg-emerald-950/25 p-3 text-sm text-emerald-300">{message}</p>}

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">{editingId ? "ویرایش پرسش" : "افزودن پرسش جدید"}</h2>
          {editingId && <button type="button" onClick={reset} className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white"><FiX /> انصراف از ویرایش</button>}
        </div>

        <label className={labelClass}>
          <span>پرسش</span>
          <input name="question" value={form.question} onChange={change} maxLength={240} required className={inputClass} placeholder="مثلاً چطور سفارش خود را پیگیری کنم؟" />
        </label>

        <label className={labelClass}>
          <span>پاسخ</span>
          <textarea name="answer" value={form.answer} onChange={change} maxLength={5000} rows={5} required className={`${inputClass} resize-y leading-8`} placeholder="پاسخ کامل و روشن را وارد کن..." />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span>متن لینک (اختیاری)</span>
            <input name="linkText" value={form.linkText} onChange={change} maxLength={80} className={inputClass} placeholder="مثلاً پیگیری سفارش" />
          </label>
          <label className={labelClass}>
            <span>آدرس لینک (اختیاری)</span>
            <input name="linkUrl" value={form.linkUrl} onChange={change} maxLength={2048} dir="ltr" className={`${inputClass} text-left`} placeholder="/account/orders یا https://example.com" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            <span>ترتیب نمایش</span>
            <input type="number" name="sortOrder" value={form.sortOrder} onChange={change} min="0" max="100000" step="1" className={inputClass} />
          </label>
          <label className="flex items-center gap-3 self-end rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={change} className="h-4 w-4 accent-cyan-500" />
            نمایش در صفحه عمومی
          </label>
        </div>

        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50">
          {editingId ? <FiSave /> : <FiPlus />}
          {saving ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : "افزودن پرسش"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-bold">فهرست پرسش‌ها ({items.length.toLocaleString("fa-IR")})</h2>
        {loading ? (
          <div className="space-y-3" aria-busy="true">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-zinc-800/60" />)}</div>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-400">هنوز پرسشی ثبت نشده است.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{item.question}</h3>
                    <span className={`rounded-full px-2 py-1 text-[10px] ${item.isActive ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}>{item.isActive ? "فعال" : "غیرفعال"}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-zinc-400">{item.answer}</p>
                  <p className="mt-2 text-xs text-zinc-500">ترتیب: {item.sortOrder.toLocaleString("fa-IR")} {item.linkUrl ? ` · ${item.linkUrl}` : ""}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={() => toggle(item)} aria-label={item.isActive ? "مخفی کردن پرسش" : "نمایش پرسش"} className="rounded-lg border border-zinc-700 p-3 text-zinc-300 transition hover:bg-zinc-800">{item.isActive ? "مخفی" : "نمایش"}</button>
                  <button type="button" onClick={() => edit(item)} aria-label="ویرایش پرسش" className="rounded-lg border border-zinc-700 p-3 text-cyan-300 transition hover:bg-zinc-800"><FiEdit2 /></button>
                  <button type="button" onClick={() => remove(item)} aria-label="حذف پرسش" className="rounded-lg border border-red-900/60 p-3 text-red-300 transition hover:bg-red-950/30"><FiTrash2 /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
