import { useCallback, useEffect, useState } from "react";
import { getAdminFeedbackSummary, getAdminSupportTicket, getAdminSupportTickets, replyAdminSupportTicket, updateAdminSupportTicket } from "../../services/feedbackApi";

const STATUS = { NEW: "جدید", IN_PROGRESS: "در حال بررسی", ANSWERED: "پاسخ داده‌شده", CLOSED: "بسته‌شده" };
const PRIORITY = { URGENT: "فوری", HIGH: "بالا", NORMAL: "عادی", LOW: "پایین" };
const TOPIC = { ORDER: "پیگیری سفارش", PAYMENT: "مشکل پرداخت", PRODUCT: "پرسش محصول", SHIPPING: "ارسال", ACCOUNT: "حساب کاربری", OTHER: "سایر" };
const date = (value) => new Date(value).toLocaleString("fa-IR");

const AdminSupport = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("NEW");
  const [priority, setPriority] = useState("NORMAL");
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("OPEN");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [summary, setSummary] = useState({ pendingComments: 0, newTickets: 0, unansweredTickets: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page: String(page), limit: "50" };
      if (filter === "OPEN") params.status = "OPEN";
      if (filter === "IN_PROGRESS") params.status = "IN_PROGRESS";
      if (filter === "ANSWERED") params.status = "ANSWERED";
      if (filter === "CLOSED") params.status = "CLOSED";
      const result = await getAdminSupportTickets(params);
      setItems(Array.isArray(result?.data) ? result.data : []);
      setTotalPages(Math.max(1, Number(result?.pagination?.totalPages) || 1));
    } catch (loadError) {
      setError(loadError.message || "دریافت درخواست‌ها ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const result = await getAdminFeedbackSummary();
        if (active) setSummary(result || {});
      } catch {
        // Keep the last known counters if the summary endpoint is temporarily unavailable.
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const choose = async (item) => {
    setError("");
    setNotice("");
    try {
      const detail = await getAdminSupportTicket(item.id);
      setSelected(detail);
      setStatus(detail.status);
      setPriority(detail.priority);
    } catch (loadError) {
      setError(loadError.message || "دریافت گفت‌وگو ناموفق بود.");
    }
  };

  const saveMeta = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateAdminSupportTicket(selected.id, { status, priority });
      setSelected((current) => ({ ...current, ...updated }));
      setNotice("وضعیت و اولویت ذخیره شد.");
      await load();
    } catch (saveError) {
      setError(saveError.message || "ذخیره وضعیت ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await replyAdminSupportTicket(selected.id, reply.trim());
      setReply("");
      const detail = await getAdminSupportTicket(selected.id);
      setSelected(detail);
      setStatus(detail.status);
      await load();
      setNotice("پاسخ ارسال شد.");
    } catch (sendError) {
      setError(sendError.message || "ارسال پاسخ ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-5 text-white">
      <header><h1 className="text-2xl font-black">پشتیبانی مشتریان</h1><p className="mt-2 text-sm text-zinc-400">درخواست‌ها بر اساس آخرین پیام مرتب شده‌اند.</p><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-lg bg-rose-950/40 px-3 py-2 text-rose-300">جدید: {Number(summary.newTickets || 0).toLocaleString("fa-IR")}</span><span className="rounded-lg bg-amber-950/40 px-3 py-2 text-amber-300">بدون پاسخ: {Number(summary.unansweredTickets || 0).toLocaleString("fa-IR")}</span></div></header>
      <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        {["OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED"].map((value) => <button key={value} type="button" onClick={() => { setFilter(value); setPage(1); setSelected(null); }} className={`rounded-lg px-3 py-2 text-xs font-semibold ${filter === value ? "bg-cyan-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>{value === "OPEN" ? "باز / بدون پاسخ" : STATUS[value]}</button>)}
        <button type="button" onClick={load} className="mr-auto rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300">تازه‌سازی</button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
      <div className="flex items-center justify-center gap-3 text-sm text-zinc-400">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">صفحه قبل</button>
        <span>صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span>
        <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">صفحه بعد</button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-3">
          {loading ? <p className="p-6 text-center text-zinc-500">در حال دریافت...</p> : items.length === 0 ? <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-500">درخواستی وجود ندارد.</p> : items.map((item) => (
            <button key={item.id} type="button" onClick={() => choose(item)} className={`w-full rounded-xl border p-4 text-right transition ${selected?.id === item.id ? "border-cyan-500 bg-cyan-950/20" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}>
              <div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{item.customerName} · {item.customerPhone || "بدون شماره"}</strong><span className="text-[11px] text-cyan-300">{PRIORITY[item.priority]}</span></div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-zinc-500"><span>{TOPIC[item.topic]} · {STATUS[item.status]}</span><span>{date(item.lastMessageAt)}</span></div>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-300">{item.messages?.[0]?.content || "بدون پیام"}</p>
            </button>
          ))}
        </section>
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          {!selected ? <p className="py-12 text-center text-sm text-zinc-500">برای مشاهده مکالمه، یک درخواست را انتخاب کنید.</p> : <>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">درخواست #{selected.id.toLocaleString("fa-IR")} · {TOPIC[selected.topic]}</h2><p className="mt-1 text-xs text-zinc-500">{selected.customerName} · {selected.customerPhone || "بدون شماره تماس"}</p></div><span className="text-xs text-cyan-300">{STATUS[selected.status]}</span></div>
            <div className="my-4 max-h-[420px] space-y-3 overflow-y-auto rounded-xl bg-zinc-950 p-3">
              {selected.messages?.map((item) => <div key={item.id} className={`max-w-[88%] rounded-xl p-3 text-sm leading-6 ${item.senderRole === "ADMIN" ? "ml-auto bg-cyan-950/60 text-cyan-50" : "mr-auto bg-zinc-800 text-zinc-100"}`}><p className="mb-1 text-[10px] opacity-60">{item.senderRole === "ADMIN" ? "پشتیبانی" : selected.customerName} · {date(item.createdAt)}</p><p className="whitespace-pre-wrap break-words">{item.content}</p></div>)}
            </div>
            <form onSubmit={sendReply} className="space-y-2"><textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={2000} rows={3} placeholder="پاسخ مشتری را بنویسید..." className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 outline-none focus:border-cyan-500" /><button disabled={saving || !reply.trim()} className="w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-zinc-950 disabled:opacity-40">{saving ? "در حال ارسال..." : "ارسال پاسخ"}</button></form>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-zinc-400">وضعیت<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-white">{Object.entries(STATUS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-xs text-zinc-400">اولویت<select value={priority} onChange={(event) => setPriority(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-white">{Object.entries(PRIORITY).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            {notice && <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}
            <button type="button" disabled={saving} onClick={saveMeta} className="mt-3 w-full rounded-lg border border-zinc-700 py-2.5 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">ذخیره وضعیت و اولویت</button>
          </>}
        </section>
      </div>
    </div>
  );
};

export default AdminSupport;
