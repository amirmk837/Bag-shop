import { useEffect, useState } from "react";
import { FiPlus, FiSave, FiTrash2, FiRefreshCw } from "react-icons/fi";
import { getAdminAboutPage, saveAboutPage } from "../../services/aboutPageApi";

const initial = {
  eyebrow: "آشنایی با ما",
  title: "درباره فروشگاه کاظمی",
  intro: "",
  storyTitle: "داستان ما",
  story: "",
  mission: "",
  vision: "",
  values: [
    { title: "شفافیت", description: "" },
    { title: "پاسخ‌گویی", description: "" },
    { title: "انتخاب آگاهانه", description: "" },
  ],
  contactText: "",
  isPublished: false,
};

const editableFields = [
  "eyebrow", "title", "intro", "storyTitle", "story",
  "mission", "vision", "values", "contactText", "isPublished",
];

function toEditableAboutPage(data = {}) {
  const editable = Object.fromEntries(
    editableFields.map((field) => [field, data[field] ?? initial[field]])
  );

  return {
    ...editable,
    values: Array.isArray(data.values)
      ? data.values.map(({ title, description }) => ({ title, description }))
      : initial.values,
  };
}

const inputClass = "w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10";
const labelClass = "block space-y-2 text-sm text-zinc-300";

function Field({ label, name, value, onChange, maxLength, multiline = false, required = false }) {
  const props = { name, value: value ?? "", onChange, maxLength, required, className: inputClass };
  return <label className={labelClass}><span>{label}</span>{multiline ? <textarea {...props} rows={5} className={`${inputClass} resize-y leading-7`} /> : <input {...props} />}</label>;
}

export default function AdminAboutPage() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async (signal) => {
    setLoading(true); setError("");
    try {
      const data = await getAdminAboutPage();
      if (!signal?.aborted) setForm(toEditableAboutPage(data));
    } catch (err) { if (!signal?.aborted) setError(err.message); }
    finally { if (!signal?.aborted) setLoading(false); }
  };

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, []);

  const change = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setError(""); setMessage("");
  };

  const updateValue = (index, field, value) => setForm((current) => ({
    ...current,
    values: current.values.map((item, i) => i === index ? { ...item, [field]: value } : item),
  }));

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const saved = await saveAboutPage(toEditableAboutPage(form));
      setForm(toEditableAboutPage(saved));
      setMessage("محتوای صفحه درباره ما با موفقیت ذخیره شد.");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div dir="rtl" className="space-y-4 p-4" aria-busy="true"><div className="h-8 w-48 animate-pulse rounded bg-zinc-700/50" /><div className="h-64 animate-pulse rounded-2xl bg-zinc-800/50" /></div>;

  return <main dir="rtl" className="space-y-6 text-white">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-black">مدیریت صفحه درباره ما</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">محتوای صفحه عمومی را از اینجا ویرایش و منتشر کن. متن‌ها به‌صورت ساده نمایش داده می‌شوند و امکان درج HTML وجود ندارد.</p></div>
      <button type="button" onClick={() => load()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"><FiRefreshCw /> تازه‌سازی</button>
    </header>

    {error && <p role="alert" className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-emerald-900/40 bg-emerald-950/25 p-3 text-sm text-emerald-300">{message}</p>}

    <form onSubmit={submit} className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
      <section className="space-y-4">
        <h2 className="font-bold">معرفی اصلی</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="عنوان کوچک" name="eyebrow" value={form.eyebrow} onChange={change} maxLength={80} required />
          <Field label="عنوان اصلی صفحه" name="title" value={form.title} onChange={change} maxLength={160} required />
        </div>
        <Field label="معرفی کوتاه" name="intro" value={form.intro} onChange={change} maxLength={600} multiline />
      </section>

      <section className="space-y-4 border-t border-zinc-800 pt-5">
        <h2 className="font-bold">داستان فروشگاه</h2>
        <Field label="عنوان بخش" name="storyTitle" value={form.storyTitle} onChange={change} maxLength={120} required />
        <Field label="متن داستان" name="story" value={form.story} onChange={change} maxLength={5000} multiline />
      </section>

      <section className="grid gap-4 border-t border-zinc-800 pt-5 sm:grid-cols-2">
        <Field label="مأموریت ما" name="mission" value={form.mission} onChange={change} maxLength={2000} multiline />
        <Field label="چشم‌انداز ما" name="vision" value={form.vision} onChange={change} maxLength={2000} multiline />
      </section>

      <section className="space-y-4 border-t border-zinc-800 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">ارزش‌های فروشگاه</h2><button type="button" disabled={form.values.length >= 6} onClick={() => setForm((current) => ({ ...current, values: [...current.values, { title: "", description: "" }] }))} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"><FiPlus /> افزودن ارزش</button></div>
        {form.values.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 sm:grid-cols-[1fr_2fr_auto]">
          <label className={labelClass}><span>عنوان</span><input className={inputClass} value={item.title} maxLength={60} onChange={(e) => updateValue(index, "title", e.target.value)} required /></label>
          <label className={labelClass}><span>توضیح</span><textarea className={inputClass} rows={2} maxLength={240} value={item.description} onChange={(e) => updateValue(index, "description", e.target.value)} required /></label>
          <button type="button" aria-label={`حذف ارزش ${index + 1}`} disabled={form.values.length <= 2} onClick={() => setForm((current) => ({ ...current, values: current.values.filter((_, i) => i !== index) }))} className="self-end rounded-lg border border-red-900/50 p-3 text-red-300 hover:bg-red-950/30 disabled:opacity-30"><FiTrash2 /></button>
        </div>)}
        <p className="text-xs text-zinc-500">حداقل ۲ و حداکثر ۶ مورد؛ همه موارد باید عنوان و توضیح داشته باشند.</p>
      </section>

      <section className="space-y-4 border-t border-zinc-800 pt-5">
        <h2 className="font-bold">ارتباط با مشتری</h2>
        <Field label="متن پایانی صفحه" name="contactText" value={form.contactText} onChange={change} maxLength={600} multiline />
      </section>

      <label className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-950/50 p-4 text-sm text-zinc-200">
        <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={change} className="h-4 w-4 accent-cyan-500" />
        انتشار صفحه درباره ما برای بازدیدکنندگان
      </label>
      <p className="text-xs leading-6 text-zinc-500">با برداشتن این گزینه، صفحه عمومی منتشر نمی‌شود؛ محتوای ذخیره‌شده در پنل مدیریت باقی می‌ماند.</p>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-5">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"><FiSave /> {saving ? "در حال ذخیره..." : "ذخیره محتوا"}</button>
        <span className="text-xs text-zinc-500">ذخیره‌سازی بدون نیاز به تغییر کد سایت</span>
      </div>
    </form>
  </main>;
}
