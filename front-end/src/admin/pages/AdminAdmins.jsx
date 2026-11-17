import { useCallback, useEffect, useState } from "react";
import { createManagedStaff, deleteManagedStaff, getManagedAdmins, updateManagedStaff } from "../../services/adminManagementApi";

const LABELS = {
  MANAGE_PRODUCTS: "مدیریت محصولات",
  MANAGE_CATEGORIES: "مدیریت دسته‌بندی‌ها",
  VIEW_ORDERS: "مشاهده سفارش‌ها",
  MANAGE_ORDERS: "مدیریت سفارش‌ها",
  MANAGE_USERS: "مدیریت کاربران",
  RECONCILE_PAYMENTS: "تطبیق پرداخت‌ها",
  VIEW_CUSTOMERS: "مشاهده مشتریان",
  MANAGE_CUSTOMERS: "مدیریت مشتریان",
  VIEW_ANALYTICS: "مشاهده آمار",
  MANAGE_BANNERS: "مدیریت بنرها",
  MANAGE_CONTENT: "مدیریت محتوا",
  MANAGE_SITE_SETTINGS: "تنظیمات سایت",
  MANAGE_SOCIAL_LINKS: "شبکه‌های اجتماعی",
  MANAGE_SHIPPING_SETTINGS: "تنظیمات ارسال",
  MODERATE_COMMENTS: "مدیریت نظرات",
  MANAGE_SUPPORT: "مدیریت پشتیبانی",
  VIEW_AUDIT_LOGS: "مشاهده گزارش امنیتی",
  VIEW_ADMIN_ACTIVITY: "مشاهده فعالیت مدیران",
};

const emptyForm = { username: "", phone: "", password: "", permissions: [] };

export default function AdminAdmins() {
  const [data, setData] = useState({ items: [], permissions: [], summary: {} });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await getManagedAdmins()); }
    catch (e) { setError(e.message || "دریافت مدیران ناموفق بود."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const togglePermission = (permission) => {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  };

  const startEdit = (admin) => {
    setEditing(admin.id);
    setForm({ username: admin.username, phone: admin.phone || "", password: "", permissions: admin.permissions || [] });
    setNotice("");
    setError("");
  };

  const resetForm = () => { setEditing(null); setForm(emptyForm); };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      if (editing) {
        await updateManagedStaff(editing, { permissions: form.permissions });
        setNotice("مجوزهای مدیر ذخیره شد.");
      } else {
        await createManagedStaff(form);
        setNotice("مدیر محدود با موفقیت ساخته شد.");
      }
      resetForm();
      await load();
    } catch (e) { setError(e.message || "ذخیره اطلاعات مدیر ناموفق بود."); }
    finally { setSaving(false); }
  };

  const changeStatus = async (admin) => {
    setError(""); setNotice("");
    try {
      await updateManagedStaff(admin.id, { isActive: !admin.isActive });
      setNotice(admin.isActive ? "حساب مدیر غیرفعال شد؛ نشست‌های قبلی او باطل شدند." : "حساب مدیر فعال شد.");
      await load();
    } catch (e) { setError(e.message || "تغییر وضعیت مدیر ناموفق بود."); }
  };

  const remove = async (admin) => {
    if (!window.confirm(`حساب مدیر «${admin.username}» برای همیشه حذف شود؟`)) return;
    setError(""); setNotice("");
    try { await deleteManagedStaff(admin.id); setNotice("حساب مدیر حذف شد."); await load(); }
    catch (e) { setError(e.message || "حذف مدیر ناموفق بود."); }
  };

  return (
    <div dir="rtl" className="space-y-5 text-white">
      <header>
        <h1 className="text-2xl font-black">مدیریت مدیران</h1>
        <p className="mt-2 text-sm text-zinc-400">مدیر کل دسترسی کامل دارد؛ مدیر محدود فقط به مجوزهای انتخاب‌شده دسترسی خواهد داشت.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs text-zinc-400">مدیران کل فعال</p><strong className="mt-2 block text-2xl">{Number(data.summary?.superAdmins || 0).toLocaleString("fa-IR")}</strong></div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs text-zinc-400">مدیران محدود</p><strong className="mt-2 block text-2xl">{Number(data.summary?.staff || 0).toLocaleString("fa-IR")}</strong></div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs text-zinc-400">مدیر محدود فعال</p><strong className="mt-2 block text-2xl">{Number(data.summary?.activeStaff || 0).toLocaleString("fa-IR")}</strong></div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3 text-sm text-emerald-300">{notice}</p>}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">{editing ? "ویرایش مجوزهای مدیر محدود" : "ایجاد مدیر محدود جدید"}</h2>
          {editing && <button type="button" onClick={resetForm} className="text-xs text-zinc-400 hover:text-white">لغو ویرایش</button>}
        </div>
        {!editing && <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-xs text-zinc-400">نام کاربری<input required minLength={3} maxLength={30} value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500" /></label>
          <label className="space-y-1 text-xs text-zinc-400">شماره تماس (اختیاری)<input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500" /></label>
          <label className="space-y-1 text-xs text-zinc-400">رمز عبور اولیه<input required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500" /></label>
        </div>}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">مجوزهای دسترسی</h3><span className="text-xs text-zinc-500">{form.permissions.length.toLocaleString("fa-IR")} مجوز انتخاب شده</span></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(data.permissions || []).map((permission) => (
              <label key={permission} className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-300 hover:border-zinc-600">
                <input type="checkbox" checked={form.permissions.includes(permission)} onChange={() => togglePermission(permission)} className="accent-cyan-500" />
                {LABELS[permission] || permission}
              </label>
            ))}
          </div>
        </div>
        <button disabled={saving || loading} className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-cyan-400 disabled:opacity-50">{saving ? "در حال ذخیره..." : editing ? "ذخیره مجوزها" : "ایجاد مدیر محدود"}</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3"><h2 className="font-bold">فهرست مدیران</h2></div>
        {loading ? <p className="p-6 text-center text-zinc-500">در حال دریافت مدیران...</p> : data.items.length === 0 ? <p className="p-6 text-center text-zinc-500">مدیری ثبت نشده است.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
          <thead className="bg-zinc-950/70 text-zinc-400"><tr><th className="p-3 text-right">نام کاربری</th><th className="p-3 text-right">نوع حساب</th><th className="p-3 text-right">وضعیت</th><th className="p-3 text-right">مجوزها</th><th className="p-3 text-right">آخرین ورود</th><th className="p-3 text-right">عملیات</th></tr></thead>
          <tbody>{data.items.map((admin) => <tr key={admin.id} className="border-t border-zinc-800">
            <td className="p-3 font-semibold">{admin.username}</td>
            <td className="p-3">{admin.role === "ADMIN" ? <span className="text-amber-300">مدیر کل</span> : "مدیر محدود"}</td>
            <td className="p-3"><span className={admin.isActive ? "text-emerald-400" : "text-red-400"}>{admin.isActive ? "فعال" : "غیرفعال"}</span></td>
            <td className="p-3">{admin.role === "ADMIN" ? "دسترسی کامل" : (admin.permissions || []).length.toLocaleString("fa-IR")}</td>
            <td className="p-3 text-zinc-400">{admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString("fa-IR") : "ثبت نشده"}</td>
            <td className="p-3">{admin.role === "ADMIN_STAFF" ? <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => startEdit(admin)} className="rounded-md bg-cyan-500/10 px-2.5 py-1.5 text-xs text-cyan-200">مجوزها</button>
              <button type="button" onClick={() => void changeStatus(admin)} className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-200">{admin.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}</button>
              <button type="button" onClick={() => void remove(admin)} className="rounded-md bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300">حذف</button>
            </div> : <span className="text-xs text-zinc-500">محافظت‌شده</span>}</td>
          </tr>)}</tbody>
        </table></div>}
      </section>
    </div>
  );
}
