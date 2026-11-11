import { useEffect, useState } from "react";
import {
  FiInstagram,
  FiMessageCircle,
  FiSave,
  FiSend,
  FiRefreshCw,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const ICONS = {
  INSTAGRAM: FiInstagram,
  TELEGRAM: FiSend,
  WHATSAPP: FiMessageCircle,
  BALE: FiMessageCircle,
  RUBIKA: FiMessageCircle,
};

const emptyPlatform = { platform: "", label: "", url: "", channelName: "", isActive: true, sortOrder: "0" };

const AdminSocialLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPlatform, setSavingPlatform] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newPlatform, setNewPlatform] = useState(emptyPlatform);
  const [adding, setAdding] = useState(false);

  const loadLinks = async (signal) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/social-links/admin`, { credentials: "include", signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "دریافت تنظیمات ناموفق بود.");
      setLinks(Array.isArray(result.data) ? result.data : []);
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message || "دریافت تنظیمات ناموفق بود.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadLinks(controller.signal);
    return () => controller.abort();
  }, []);

  const updateDraft = (platform, field, value) => {
    setLinks((current) => current.map((item) => item.platform === platform ? { ...item, [field]: value } : item));
    setError("");
    setSuccess("");
  };

  const handleSave = async (item) => {
    if (savingPlatform !== null) return;
    try {
      setSavingPlatform(item.platform);
      setError("");
      setSuccess("");
      const response = await fetch(`${API_BASE_URL}/social-links/admin/${encodeURIComponent(item.platform)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: item.label,
          url: item.url,
          channelName: item.channelName,
          isActive: item.isActive,
          sortOrder: Number(item.sortOrder),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "ذخیره تنظیمات ناموفق بود.");
      setLinks((current) => current.map((link) => link.platform === item.platform ? result.data : link));
      setSuccess(`تنظیمات «${item.label}» ذخیره شد.`);
    } catch (requestError) {
      setError(requestError.message || "ذخیره تنظیمات ناموفق بود.");
    } finally {
      setSavingPlatform(null);
    }
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    if (adding) return;
    try {
      setAdding(true);
      setError("");
      setSuccess("");
      const platform = newPlatform.platform.trim().toUpperCase().replace(/[\\s-]+/g, "_");
      const response = await fetch(`${API_BASE_URL}/social-links/admin`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPlatform, platform, sortOrder: Number(newPlatform.sortOrder) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "افزودن پلتفرم ناموفق بود.");
      setLinks((current) => [...current, result.data].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
      setNewPlatform(emptyPlatform);
      setSuccess("پلتفرم جدید اضافه شد.");
    } catch (requestError) {
      setError(requestError.message || "افزودن پلتفرم ناموفق بود.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`پلتفرم «${item.label}» حذف شود؟`)) return;
    try {
      setSavingPlatform(item.platform);
      setError("");
      const response = await fetch(`${API_BASE_URL}/social-links/admin/${encodeURIComponent(item.platform)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "حذف پلتفرم ناموفق بود.");
      setLinks((current) => current.filter((link) => link.platform !== item.platform));
      setSuccess("پلتفرم حذف شد.");
    } catch (requestError) {
      setError(requestError.message || "حذف پلتفرم ناموفق بود.");
    } finally {
      setSavingPlatform(null);
    }
  };

  const renderFields = (item, onChange, disabled = false) => {
    const Icon = ICONS[item.platform] || FiMessageCircle;
    return (
      <>
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200"><Icon size={18} />{item.label || item.platform}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-xs text-zinc-400">
            <span>نام پلتفرم</span>
            <input value={item.label} onChange={(e) => onChange("label", e.target.value)} maxLength={60} disabled={disabled}
              className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-zinc-400 disabled:opacity-50" />
          </label>
          <label className="space-y-2 text-xs text-zinc-400">
            <span>لینک شبکه اجتماعی</span>
            <input type="url" dir="ltr" value={item.url || ""} onChange={(e) => onChange("url", e.target.value)}
              placeholder="https://example.com/channel" maxLength={2048} disabled={disabled}
              className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-left text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-400 disabled:opacity-50" />
          </label>
          <label className="space-y-2 text-xs text-zinc-400">
            <span>نام کانال یا عنوان نمایشی</span>
            <input type="text" value={item.channelName || ""} onChange={(e) => onChange("channelName", e.target.value)}
              placeholder="مثلاً @your_channel" maxLength={100} disabled={disabled}
              className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-zinc-400 disabled:opacity-50" />
          </label>
          <label className="space-y-2 text-xs text-zinc-400">
            <span>ترتیب نمایش (عدد کمتر، بالاتر)</span>
            <input type="number" min="0" max="10000" step="1" value={item.sortOrder}
              onChange={(e) => onChange("sortOrder", e.target.value)} disabled={disabled}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-zinc-400 disabled:opacity-50" />
          </label>
          <label className="flex items-center gap-3 self-end rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
            <input type="checkbox" checked={item.isActive} onChange={(e) => onChange("isActive", e.target.checked)} disabled={disabled} className="h-4 w-4 accent-white" />
            نمایش در فوتر فعال باشد
          </label>
        </div>
      </>
    );
  };

  return (
    <div dir="rtl" className="space-y-7 text-white">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black">مدیریت شبکه‌های اجتماعی</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">پلتفرم‌های پیش‌فرض و دلخواه، لینک، نام کانال و ترتیب نمایش را مدیریت کن.</p>
        </div>
        <button type="button" onClick={() => loadLinks()} disabled={loading || savingPlatform !== null}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm transition hover:bg-zinc-800 disabled:opacity-50">
          <FiRefreshCw /> تازه‌سازی
        </button>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm leading-6 text-red-400">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm leading-6 text-emerald-400">{success}</div>}

      <form onSubmit={handleAdd} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7">
        <div>
          <h3 className="text-lg font-bold">افزودن پلتفرم جدید</h3>
          <p className="mt-1 text-xs text-zinc-500">شناسه انگلیسی یکتا وارد کن؛ مانند EITA، LINKEDIN یا CUSTOM_CHAT.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-xs text-zinc-400"><span>شناسه انگلیسی پلتفرم</span>
            <input required value={newPlatform.platform} onChange={(e) => setNewPlatform((v) => ({ ...v, platform: e.target.value }))} maxLength={40} dir="ltr" placeholder="EITA"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-left text-sm text-white outline-none focus:border-cyan-500" />
          </label>
          <label className="space-y-2 text-xs text-zinc-400"><span>نام نمایشی پلتفرم</span>
            <input required value={newPlatform.label} onChange={(e) => setNewPlatform((v) => ({ ...v, label: e.target.value }))} maxLength={60} placeholder="ایتا"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500" />
          </label>
        </div>
        <button type="submit" disabled={adding} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:opacity-50">
          <FiPlus />{adding ? "در حال افزودن..." : "افزودن پلتفرم"}
        </button>
      </form>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7">
        <div className="mb-6"><h3 className="text-lg font-bold">پلتفرم‌های ثبت‌شده</h3><p className="mt-2 text-sm text-zinc-500">نام کانال پس از ذخیره باید در فوتر و فرم مدیریت باقی بماند.</p></div>
        {loading ? <p className="py-10 text-center text-sm text-zinc-400">در حال دریافت تنظیمات...</p> : links.length === 0 ? <p className="py-10 text-center text-sm text-zinc-400">هنوز پلتفرمی ثبت نشده است.</p> : (
          <div className="space-y-6">
            {links.map((item) => (
              <div key={item.platform} className="space-y-3 border-b border-zinc-800 pb-6 last:border-0 last:pb-0">
                {renderFields(item, (field, value) => updateDraft(item.platform, field, value), savingPlatform !== null)}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-zinc-600" dir="ltr">{item.platform}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleDelete(item)} disabled={savingPlatform !== null}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-900/60 px-4 py-3 text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-50"><FiTrash2 /> حذف پلتفرم</button>
                    <button type="button" onClick={() => handleSave(item)} disabled={savingPlatform !== null}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"><FiSave />{savingPlatform === item.platform ? "در حال ذخیره..." : "ذخیره تنظیمات"}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminSocialLinks;
