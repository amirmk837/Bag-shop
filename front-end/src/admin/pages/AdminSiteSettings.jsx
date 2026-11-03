import { useEffect, useState } from "react";
import { getSiteSettings, saveSiteSettings } from "../../services/siteSettingsApi";

const initial = { storeName: "فروشگاه کاظمی", phone: "", headerText: "", footerAbout: "", footerCaption: "", logoUrl: "", footerLogoUrl: "", logoFile: null, footerLogoFile: null };

function TextField({ label, name, value, onChange, multiline = false, maxLength = 180 }) {
  const common = "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-cyan-500";
  return <label className="block space-y-2"><span className="text-sm text-zinc-300">{label}</span>{multiline ? <textarea name={name} value={value || ""} onChange={onChange} maxLength={maxLength} rows={4} className={common} /> : <input name={name} value={value || ""} onChange={onChange} maxLength={maxLength} className={common} />}</label>;
}

export default function AdminSiteSettings() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    getSiteSettings().then((data) => { if (active) setForm({ ...initial, ...data }); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const change = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));
  const chooseFile = (key) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setError("فرمت مجاز: JPG، PNG، WEBP و AVIF."); event.target.value = ""; return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("حجم هر لوگو حداکثر ۳ مگابایت است."); event.target.value = ""; return;
    }
    setError("");
    setForm((old) => ({ ...old, [key]: file }));
  };

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const saved = await saveSiteSettings(form);
      setForm({ ...initial, ...saved });
      setMessage("تنظیمات با موفقیت ذخیره شد.");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const imageField = (title, key, urlKey) => (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <label className="block text-sm font-semibold text-zinc-200">{title}</label>
      <p className="mt-1 text-xs text-zinc-500">JPG / PNG / WEBP / AVIF · حداکثر ۳ مگابایت · پیشنهاد ابعاد: لوگوی اصلی ۵۱۲×۵۱۲ و لوگوی فوتر ۶۰۰×۲۵۰ پیکسل</p>
      {(form[key] || form[urlKey]) && <img src={form[key] ? URL.createObjectURL(form[key]) : form[urlKey]} alt={title} className="my-3 h-20 max-w-48 object-contain" />}
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={chooseFile(key)} className="mt-3 block w-full text-sm text-zinc-400" />
    </div>
  );

  if (loading) return <p className="p-8 text-zinc-400">در حال دریافت تنظیمات...</p>;
  return <main dir="rtl" className="space-y-5 text-white">
    <header><h1 className="text-2xl font-bold">تنظیمات ظاهری سایت</h1><p className="mt-2 text-sm leading-7 text-zinc-400">نام فروشگاه، لوگوها و متن‌های ثابت سربرگ و فوتر را از این بخش مدیریت کن.</p></header>
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="نام فروشگاه" name="storeName" value={form.storeName} onChange={change} maxLength={80} />
        <TextField label="شماره تماس فروشگاه" name="phone" value={form.phone} onChange={change} maxLength={30} />
      </div>
      <TextField label="متن کوتاه کنار لوگو در سربرگ" name="headerText" value={form.headerText} onChange={change} maxLength={180} />
      <div className="grid gap-4 lg:grid-cols-2">{imageField("لوگوی اصلی سربرگ", "logoFile", "logoUrl")}{imageField("لوگوی فوتر", "footerLogoFile", "footerLogoUrl")}</div>
      <TextField label="متن معرفی کنار لوگو در فوتر" name="footerAbout" value={form.footerAbout} onChange={change} multiline maxLength={1000} />
      <TextField label="متن انتهایی فوتر" name="footerCaption" value={form.footerCaption} onChange={change} maxLength={180} />
      {error && <p role="alert" className="rounded-lg bg-red-950/50 p-3 text-sm text-red-300">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-emerald-950/50 p-3 text-sm text-emerald-300">{message}</p>}
      <button disabled={saving} className="rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-500 disabled:opacity-50">{saving ? "در حال ذخیره..." : "ذخیره تنظیمات سایت"}</button>
    </form>
  </main>;
}
