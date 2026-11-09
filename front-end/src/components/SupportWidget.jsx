import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiMessageCircle, FiX, FiArrowRight, FiRefreshCw, FiClock } from "react-icons/fi";
import { useAuth } from "../context/useAuth";
import {
  createSupportTicket,
  getSupportSettings,
  getSupportTicket,
  getSupportTickets,
  sendSupportMessage,
} from "../services/feedbackApi";

const TOPICS = [
  ["ORDER", "پیگیری سفارش"],
  ["PAYMENT", "مشکل پرداخت"],
  ["PRODUCT", "پرسش درباره محصول"],
  ["SHIPPING", "ارسال و کد رهگیری"],
  ["ACCOUNT", "حساب کاربری"],
  ["OTHER", "سایر موارد"],
];

const DAYS = [
  ["saturday", "شنبه"],
  ["sunday", "یکشنبه"],
  ["monday", "دوشنبه"],
  ["tuesday", "سه‌شنبه"],
  ["wednesday", "چهارشنبه"],
  ["thursday", "پنجشنبه"],
  ["friday", "جمعه"],
];

const getTehranSupportStatus = (hours) => {
  if (!hours) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dayKey = {
    Saturday: "saturday",
    Sunday: "sunday",
    Monday: "monday",
    Tuesday: "tuesday",
    Wednesday: "wednesday",
    Thursday: "thursday",
    Friday: "friday",
  }[values.weekday];
  const day = hours[dayKey];
  if (!day?.enabled) return false;
  const now = `${values.hour}:${values.minute}`;
  return now >= day.start && now < day.end;
};

const SupportWidget = () => {
  const { user, loading: authLoading } = useAuth();
  const customer = !authLoading && user?.role === "USER" ? user : null;
  return <SupportWidgetContent user={customer} authLoading={authLoading} />;
};

const SupportWidgetContent = ({ user, authLoading }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [topic, setTopic] = useState("OTHER");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({ supportHours: null, supportResponseText: "" });

  const supportStatus = useMemo(
    () => getTehranSupportStatus(settings.supportHours),
    [settings.supportHours, open],
  );

  const loadSettings = useCallback(async () => {
    try {
      const result = await getSupportSettings();
      setSettings(result || { supportHours: null, supportResponseText: "" });
    } catch {
      // The support entry point remains available if public settings cannot be loaded.
    }
  }, []);

  const loadTickets = useCallback(async () => {
    if (!user) return;
    try {
      const result = await getSupportTickets();
      setTickets(Array.isArray(result) ? result : []);
    } catch (loadError) {
      setError(loadError.message || "دریافت گفت‌وگوها ممکن نیست.");
    }
  }, [user]);

  const loadTicket = useCallback(async (id) => {
    setLoading(true);
    setError("");
    try {
      const result = await getSupportTicket(id);
      setTicket(result);
      setSelectedId(id);
    } catch (loadError) {
      setError(loadError.message || "دریافت گفت‌وگو ممکن نیست.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  useEffect(() => {
    if (!open || !user) return undefined;
    const timer = window.setTimeout(() => { void loadTickets(); }, 0);
    return () => window.clearTimeout(timer);
  }, [open, user, loadTickets]);

  useEffect(() => {
    if (!open || !selectedId || !user) return undefined;
    const timer = window.setInterval(() => {
      getSupportTicket(selectedId).then(setTicket).catch(() => {});
      void loadTickets();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [open, selectedId, user, loadTickets]);

  const goToLogin = () => navigate("/login", {
    state: {
      from: {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
    },
  });

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!user || message.trim().length < 5) return;
    setSending(true);
    setError("");
    try {
      const created = await createSupportTicket({ topic, content: message.trim() });
      setMessage("");
      await loadTickets();
      await loadTicket(created.id);
    } catch (sendError) {
      setError(sendError.message || "ثبت درخواست انجام نشد.");
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (event) => {
    event.preventDefault();
    if (!user || !selectedId || !message.trim()) return;
    setSending(true);
    setError("");
    try {
      await sendSupportMessage(selectedId, message.trim());
      setMessage("");
      await loadTicket(selectedId);
      await loadTickets();
    } catch (sendError) {
      setError(sendError.message || "ارسال پیام انجام نشد.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[80]" dir="rtl">
      {open && (
        <section aria-label="پشتیبانی فروشگاه" className="mb-3 flex h-[min(78vh,650px)] w-[min(92vw,390px)] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 text-white shadow-2xl shadow-black/50">
          <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3">
            <div>
              <h2 className="font-bold">پشتیبانی فروشگاه</h2>
              <p className="mt-1 text-[11px] text-zinc-500">
                {authLoading ? "در حال بررسی وضعیت ورود..." : user ? `${user.username}${user.phone ? ` · ${user.phone}` : ""}` : "پاسخگویی به مشتریان"}
              </p>
            </div>
            <button type="button" aria-label="بستن پنجره پشتیبانی" onClick={() => setOpen(false)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"><FiX size={20} /></button>
          </header>

          <div className="border-b border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <FiClock className="text-cyan-300" />
              ساعات کاری پشتیبانی
              {supportStatus !== null && (
                <span className={supportStatus ? "mr-auto text-emerald-300" : "mr-auto text-amber-300"}>
                  {supportStatus ? "اکنون فعال" : "اکنون غیرفعال"}
                </span>
              )}
            </div>
            {settings.supportHours ? (
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                {DAYS.map(([key, label]) => {
                  const day = settings.supportHours[key];
                  return <div key={key} className="flex justify-between gap-2"><span>{label}</span><span>{day?.enabled ? `${day.start} تا ${day.end}` : "تعطیل"}</span></div>;
                })}
              </div>
            ) : <p className="mt-2 text-[11px] text-zinc-500">ساعات کاری هنوز توسط مدیریت تنظیم نشده است.</p>}
            {settings.supportResponseText && <p className="mt-2 border-t border-zinc-800 pt-2 text-xs leading-5 text-cyan-200">{settings.supportResponseText}</p>}
          </div>

          {authLoading ? (
            <p className="flex-1 p-6 text-center text-sm text-zinc-400">در حال بررسی حساب کاربری...</p>
          ) : !user ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <FiMessageCircle size={32} className="text-cyan-300" />
              <h3 className="font-bold">برای ارسال پیام وارد حساب شوید</h3>
              <p className="text-xs leading-6 text-zinc-400">مشاهده ساعات کاری برای همه آزاد است؛ برای ثبت درخواست یا مشاهده گفت‌وگوهای قبلی باید وارد حساب کاربری خود شوید.</p>
              <button type="button" onClick={goToLogin} className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-cyan-400">ورود به حساب کاربری</button>
              <button type="button" onClick={() => navigate("/register", { state: { from: { pathname: location.pathname, search: location.search, hash: location.hash } } })} className="text-xs text-cyan-300 hover:underline">هنوز حساب ندارید؟ ثبت‌نام کنید</button>
            </div>
          ) : selectedId && ticket ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
                <button type="button" onClick={() => { setSelectedId(null); setTicket(null); setMessage(""); }} className="inline-flex items-center gap-1 text-xs text-cyan-300"><FiArrowRight /> همه درخواست‌ها</button>
                <span className="text-[11px] text-zinc-500">درخواست #{selectedId.toLocaleString("fa-IR")}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {loading && <p className="text-center text-xs text-zinc-500">در حال دریافت گفت‌وگو...</p>}
                {ticket.messages?.map((item) => (
                  <div key={item.id} className={`max-w-[88%] rounded-xl p-3 text-sm leading-6 ${item.senderRole === "ADMIN" ? "ml-auto bg-cyan-950/60 text-cyan-50" : "mr-auto bg-zinc-800 text-zinc-100"}`}>
                    <p className="mb-1 text-[10px] opacity-60">{item.senderRole === "ADMIN" ? "پشتیبانی" : "شما"}</p>
                    <p className="whitespace-pre-wrap break-words">{item.content}</p>
                  </div>
                ))}
                {ticket.status === "CLOSED" && <p className="rounded-lg bg-zinc-900 p-3 text-center text-xs text-zinc-400">این گفت‌وگو بسته شده است.</p>}
              </div>
              {ticket.status !== "CLOSED" && <form onSubmit={handleReply} className="border-t border-zinc-800 p-3"><textarea rows={2} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} placeholder="پیام خود را بنویسید..." className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm outline-none focus:border-cyan-500" /><button disabled={sending || !message.trim()} className="mt-2 w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-zinc-950 disabled:opacity-40">{sending ? "در حال ارسال..." : "ارسال پیام"}</button></form>}
            </>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              <button type="button" onClick={() => { setSelectedId(null); setTicket(null); }} className="w-full rounded-xl border border-cyan-700/50 bg-cyan-950/30 p-3 text-right text-sm font-bold text-cyan-200">+ ثبت درخواست جدید</button>
              {tickets.map((item) => (
                <button key={item.id} type="button" onClick={() => loadTicket(item.id)} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-right hover:border-zinc-600">
                  <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">درخواست #{item.id.toLocaleString("fa-IR")}</span><span className="text-[10px] text-cyan-300">{item.status === "NEW" ? "جدید" : item.status === "IN_PROGRESS" ? "در حال بررسی" : item.status === "ANSWERED" ? "پاسخ داده‌شده" : "بسته‌شده"}</span></div>
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{item.messages?.[0]?.content || "بدون پیام"}</p>
                </button>
              ))}
              {tickets.length === 0 && <p className="py-3 text-center text-xs text-zinc-500">هنوز درخواست پشتیبانی ندارید.</p>}
              <form onSubmit={handleCreate} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                <label className="mb-2 block text-xs text-zinc-400">موضوع درخواست جدید</label>
                <select value={topic} onChange={(event) => setTopic(event.target.value)} className="mb-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-sm">{TOPICS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                <textarea rows={3} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} placeholder="چطور می‌توانیم کمکتان کنیم؟" className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm outline-none focus:border-cyan-500" />
                <button disabled={sending || message.trim().length < 5} className="mt-2 w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-zinc-950 disabled:opacity-40">{sending ? "در حال ثبت..." : "ثبت درخواست"}</button>
              </form>
            </div>
          )}
          {error && <p role="alert" className="border-t border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-300">{error}</p>}
          {user && <div className="flex justify-end border-t border-zinc-800 px-3 py-2"><button type="button" onClick={() => { void loadTickets(); if (selectedId) void loadTicket(selectedId); }} className="inline-flex items-center gap-1 text-[11px] text-zinc-500"><FiRefreshCw size={12} /> تازه‌سازی</button></div>}
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-3 font-bold text-zinc-950 shadow-xl shadow-black/30 transition hover:bg-cyan-400">
        {open ? <FiX size={18} /> : <FiMessageCircle size={18} />}
        <span className="text-sm">{open ? "بستن" : "پشتیبانی"}</span>
      </button>
    </div>
  );
};

export default SupportWidget;
