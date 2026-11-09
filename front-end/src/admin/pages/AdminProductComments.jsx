import { useCallback, useEffect, useState } from "react";
import { deleteAdminProductComment, getAdminProductComments, updateAdminProductComment } from "../../services/feedbackApi";

const STATUS = { PENDING: "در انتظار بررسی", APPROVED: "تأییدشده", REJECTED: "ردشده" };
const PRIORITY = { URGENT: "فوری", HIGH: "بالا", NORMAL: "عادی", LOW: "پایین" };
const date = (value) => new Date(value).toLocaleString("fa-IR");

const AdminProductComments = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("PENDING");
  const [priority, setPriority] = useState("NORMAL");
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminProductComments({ page: String(page), limit: "50", ...(filter !== "ALL" ? { status: filter } : {}) });
      setItems(Array.isArray(result?.data) ? result.data : []);
      setTotalPages(Math.max(1, Number(result?.pagination?.totalPages) || 1));
    } catch (loadError) {
      setError(loadError.message || "دریافت دیدگاه‌ها ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  const choose = (item) => {
    setSelected(item);
    setStatus(item.status);
    setPriority(item.priority);
    setReply(item.adminReply || "");
    setNotice("");
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateAdminProductComment(selected.id, {
        status,
        priority,
        ...(reply.trim()
          ? { adminReply: reply.trim() }
          : selected.adminReply
            ? { adminReply: null }
            : {}),
      });
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
      setNotice("تغییرات ذخیره شد.");
      await load();
    } catch (saveError) {
      setError(saveError.message || "ذخیره تغییرات ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    if (!selected || !window.confirm("این دیدگاه به‌طور کامل حذف شود؟ این عملیات قابل بازگشت نیست.")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await deleteAdminProductComment(selected.id);
      setSelected(null);
      setNotice("دیدگاه حذف شد.");
      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await load();
      }
    } catch (deleteError) {
      setError(deleteError.message || "حذف دیدگاه انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-5 text-white">
      <header><h1 className="text-2xl font-black">نظرات و پرسش‌های محصولات</h1><p className="mt-2 text-sm text-zinc-400">بررسی، پاسخ‌گویی و تعیین اولویت دیدگاه‌های مشتریان</p></header>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <div className="flex flex-wrap gap-2">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((value) => <button key={value} type="button" onClick={() => { setFilter(value); setPage(1); setSelected(null); }} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filter === value ? "bg-cyan-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>{value === "ALL" ? "همه" : STATUS[value]}</button>)}
        </div>
        <button type="button" onClick={load} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300">تازه‌سازی</button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
      <div className="flex items-center justify-center gap-3 text-sm text-zinc-400">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">صفحه قبل</button>
        <span>صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span>
        <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">صفحه بعد</button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <section className="space-y-3">
          {loading ? <p className="p-6 text-center text-zinc-500">در حال دریافت...</p> : items.length === 0 ? <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-500">موردی وجود ندارد.</p> : items.map((item) => (
            <button key={item.id} type="button" onClick={() => choose(item)} className={`w-full rounded-xl border p-4 text-right transition ${selected?.id === item.id ? "border-cyan-500 bg-cyan-950/20" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{item.product?.title || "محصول حذف‌شده"} · {item.product?.productCode}</strong><span className="text-[11px] text-cyan-300">{PRIORITY[item.priority]}</span></div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">{item.content}</p>
              <div className="mt-3 flex flex-wrap justify-between gap-2 text-[11px] text-zinc-500"><span>{item.user?.username} · {item.user?.phone || "بدون شماره"}</span><span>{date(item.createdAt)} · {STATUS[item.status]}</span></div>
            </button>
          ))}
        </section>
        <section className="h-fit rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          {!selected ? <p className="py-10 text-center text-sm text-zinc-500">برای بررسی، یک دیدگاه را انتخاب کنید.</p> : <>
            <h2 className="font-bold">{selected.type === "QUESTION" ? "پرسش مشتری" : "دیدگاه مشتری"}</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">{selected.content}</p>
            <div className="mt-3 text-xs leading-6 text-zinc-500">محصول: {selected.product?.title} ({selected.product?.productCode})<br />مشتری: {selected.user?.username} · {selected.user?.phone || "شماره ثبت نشده"}<br />ثبت: {date(selected.createdAt)}</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-zinc-400">وضعیت<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-white">{Object.entries(STATUS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-xs text-zinc-400">اولویت<select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-white">{Object.entries(PRIORITY).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            <label className="mt-4 block text-xs text-zinc-400">پاسخ فروشگاه<textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={1500} rows={5} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 text-white outline-none focus:border-cyan-500" placeholder="پاسخ خود را بنویسید..." /></label>
            {notice && <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}
            <button type="button" disabled={saving} onClick={save} className="mt-4 w-full rounded-lg bg-cyan-500 py-3 text-sm font-bold text-zinc-950 disabled:opacity-50">{saving ? "در حال ذخیره..." : "ذخیره تغییرات"}</button>
            <button type="button" disabled={saving} onClick={removeSelected} className="mt-2 w-full rounded-lg border border-red-800/70 bg-red-950/30 py-3 text-sm font-bold text-red-300 hover:bg-red-950/60 disabled:opacity-50">حذف کامل دیدگاه</button>
          </>}
        </section>
      </div>
    </div>
  );
};

export default AdminProductComments;
