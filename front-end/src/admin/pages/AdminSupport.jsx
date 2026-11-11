import { useCallback, useEffect, useState } from "react";
import {
  FiCheck,
  FiChevronDown,
  FiClock,
  FiInbox,
  FiMessageCircle,
  FiTrash2,
} from "react-icons/fi";
import {
  deleteAdminSupportTicket,
  getAdminFeedbackSummary,
  getAdminSupportTicket,
  getAdminSupportTickets,
  getSupportSettings,
  replyAdminSupportTicket,
  updateSupportSettings,
  updateAdminSupportTicket,
} from "../../services/feedbackApi";

const STATUS = {
  NEW: {
    label: "جدید",
    description: "هنوز بررسی نشده",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    dot: "bg-sky-400",
  },
  IN_PROGRESS: {
    label: "در حال بررسی",
    description: "در حال پیگیری توسط فروشگاه",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  ANSWERED: {
    label: "پاسخ داده‌شده",
    description: "پاسخ برای مشتری ارسال شده",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  CLOSED: {
    label: "بسته‌شده",
    description: "گفت‌وگو به پایان رسیده",
    className: "border-zinc-600 bg-zinc-800 text-zinc-300",
    dot: "bg-zinc-400",
  },
};
const TOPIC = {
  ORDER: "پیگیری سفارش",
  PAYMENT: "مشکل پرداخت",
  PRODUCT: "پرسش محصول",
  SHIPPING: "ارسال",
  ACCOUNT: "حساب کاربری",
  OTHER: "سایر",
};
const DAYS = [
  ["saturday", "شنبه"],
  ["sunday", "یکشنبه"],
  ["monday", "دوشنبه"],
  ["tuesday", "سه‌شنبه"],
  ["wednesday", "چهارشنبه"],
  ["thursday", "پنجشنبه"],
  ["friday", "جمعه"],
];
const makeDefaultHours = () =>
  Object.fromEntries(DAYS.map(([key]) => [key, { enabled: false, start: "09:00", end: "18:00" }]));
const date = (value) => new Date(value).toLocaleString("fa-IR");

const AdminSupport = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("OPEN");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [summary, setSummary] = useState({ newTickets: 0, unansweredTickets: 0 });

  const [hours, setHours] = useState(makeDefaultHours);
  const [responseText, setResponseText] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsNotice, setSettingsNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page: String(page), limit: "50" };
      if (filter === "OPEN") params.status = "OPEN";
      if (filter !== "OPEN") params.status = filter;
      const result = await getAdminSupportTickets(params);
      setItems(Array.isArray(result?.data) ? result.data : []);
      setTotalPages(Math.max(1, Number(result?.pagination?.totalPages) || 1));
    } catch (loadError) {
      setError(loadError.message || "دریافت درخواست‌ها ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const result = await getSupportSettings();
        if (!active) return;
        setHours(result?.supportHours || makeDefaultHours());
        setResponseText(result?.supportResponseText || "");
      } catch (loadError) {
        if (active) setSettingsError(loadError.message || "دریافت تنظیمات ساعات کاری ناموفق بود.");
      } finally {
        if (active) setSettingsLoading(false);
      }
    };
    void loadSettings();
    return () => { active = false; };
  }, []);

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
    setStatusMenuOpen(false);
    try {
      const detail = await getAdminSupportTicket(item.id);
      setSelected(detail);
    } catch (loadError) {
      setError(loadError.message || "دریافت گفت‌وگو ناموفق بود.");
    }
  };

  const changeDay = (key, field, value) => {
    setHours((current) => ({
      ...current,
      [key]: { ...current[key], [field]: value },
    }));
  };

  const saveHours = async () => {
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsNotice("");
    try {
      await updateSupportSettings({ supportHours: hours, supportResponseText: responseText });
      setSettingsNotice("ساعات کاری و متن پاسخگویی ذخیره شد.");
    } catch (saveError) {
      setSettingsError(saveError.message || "ذخیره تنظیمات پشتیبانی انجام نشد.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const moveTicket = async (nextStatus) => {
    if (!selected || selected.status === nextStatus || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    setStatusMenuOpen(false);
    try {
      const updated = await updateAdminSupportTicket(selected.id, { status: nextStatus });
      setSelected((current) => ({ ...current, ...updated }));
      setNotice(`وضعیت گفت‌وگو به «${STATUS[nextStatus].label}» تغییر کرد.`);
      await load();
    } catch (saveError) {
      setError(saveError.message || "تغییر وضعیت گفت‌وگو انجام نشد.");
    } finally {
      setSaving(false);
    }
  };

  const removeTicket = async () => {
    if (!selected || saving) return;
    const confirmed = window.confirm(
      `گفت‌وگوی شماره ${selected.id} و تمام پیام‌های آن برای همیشه حذف شود؟ این کار قابل بازگشت نیست.`,
    );
    if (!confirmed) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await deleteAdminSupportTicket(selected.id);
      setSelected(null);
      setReply("");
      setStatusMenuOpen(false);
      setNotice("گفت‌وگو حذف شد.");
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else await load();
    } catch (deleteError) {
      setError(deleteError.message || "حذف گفت‌وگو انجام نشد.");
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
      <header>
        <h1 className="text-2xl font-black">پشتیبانی مشتریان</h1>
        <p className="mt-2 text-sm text-zinc-400">درخواست‌ها بر اساس آخرین پیام مرتب شده‌اند.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg bg-rose-950/40 px-3 py-2 text-rose-300">جدید: {Number(summary.newTickets || 0).toLocaleString("fa-IR")}</span>
          <span className="rounded-lg bg-amber-950/40 px-3 py-2 text-amber-300">بدون پاسخ: {Number(summary.unansweredTickets || 0).toLocaleString("fa-IR")}</span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        {["OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED"].map((value) => (
          <button key={value} type="button" onClick={() => { setFilter(value); setPage(1); setSelected(null); }}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === value ? "bg-cyan-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}>
            {value === "OPEN" ? "باز / جدید" : STATUS[value].label}
          </button>
        ))}
        <button type="button" onClick={load} className="mr-auto rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800">تازه‌سازی</button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
      <div className="flex items-center justify-center gap-3 text-sm text-zinc-400">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">صفحه قبل</button>
        <span>صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span>
        <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">صفحه بعد</button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-3">
          {loading ? <p className="p-6 text-center text-zinc-500">در حال دریافت...</p> :
            items.length === 0 ? <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-500">درخواستی وجود ندارد.</p> :
            items.map((item) => (
              <button key={item.id} type="button" onClick={() => choose(item)}
                className={`w-full rounded-xl border p-4 text-right transition ${selected?.id === item.id ? "border-cyan-500 bg-cyan-950/20" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm">{item.customerName} · {item.customerPhone || "بدون شماره"}</strong>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] ${STATUS[item.status]?.className || ""}`}>{STATUS[item.status]?.label}</span>
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-zinc-500"><span>{TOPIC[item.topic]}</span><span>{date(item.lastMessageAt)}</span></div>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-300">{item.messages?.[0]?.content || "بدون پیام"}</p>
              </button>
            ))}
        </section>

        <section className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          {!selected ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
              <span className="rounded-2xl bg-zinc-800 p-4 text-zinc-400"><FiInbox size={26} /></span>
              <p className="text-sm text-zinc-400">برای مشاهده مکالمه، یک درخواست را انتخاب کنید.</p>
            </div>
          ) : <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">درخواست #{selected.id.toLocaleString("fa-IR")} · {TOPIC[selected.topic]}</h2>
                <p className="mt-2 text-xs text-zinc-400">نام: {selected.customerName || selected.user?.username || "ثبت نشده"}</p>
                <p className="mt-1 text-xs text-zinc-400">موبایل: {selected.customerPhone || selected.user?.phone || "ثبت نشده"}</p>
                <p className="mt-1 max-w-xl text-xs leading-6 text-zinc-400">آدرس: {selected.customerAddress || "ثبت نشده"}</p>
              </div>
              <button type="button" onClick={removeTicket} disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50">
                <FiTrash2 size={14} /> حذف گفت‌وگو
              </button>
            </div>

            <div className="relative mt-4">
              <button type="button" onClick={() => setStatusMenuOpen((value) => !value)} disabled={saving}
                aria-expanded={statusMenuOpen}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-right transition hover:brightness-110 disabled:opacity-50 ${STATUS[selected.status]?.className || "border-zinc-700 bg-zinc-800"}`}>
                <span className="flex min-w-0 items-center gap-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS[selected.status]?.dot || "bg-zinc-400"}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{STATUS[selected.status]?.label}</span>
                    <span className="mt-0.5 block text-[11px] opacity-75">{STATUS[selected.status]?.description}</span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-xs font-semibold"><span>تغییر بخش</span><FiChevronDown className={`transition ${statusMenuOpen ? "rotate-180" : ""}`} /></span>
              </button>
              {statusMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 p-2 shadow-2xl shadow-black/40">
                  <p className="px-3 pb-2 pt-1 text-[11px] text-zinc-500">انتقال گفت‌وگو به بخش موردنظر</p>
                  {Object.entries(STATUS).map(([value, item]) => (
                    <button key={value} type="button" disabled={saving || selected.status === value} onClick={() => moveTicket(value)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-right transition hover:bg-zinc-800 disabled:cursor-default disabled:opacity-50 ${selected.status === value ? "bg-zinc-800" : ""}`}>
                      <span className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                        <span><span className="block text-sm font-semibold text-zinc-100">{item.label}</span><span className="mt-0.5 block text-[10px] text-zinc-500">{item.description}</span></span>
                      </span>
                      {selected.status === value && <FiCheck className="text-cyan-300" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="my-4 max-h-[420px] space-y-3 overflow-y-auto rounded-xl bg-zinc-950 p-3">
              {selected.messages?.map((item) => (
                <div key={item.id} className={`max-w-[88%] rounded-xl p-3 text-sm leading-6 ${item.senderRole === "ADMIN" ? "ml-auto bg-cyan-950/60 text-cyan-50" : "mr-auto bg-zinc-800 text-zinc-100"}`}>
                  <p className="mb-1 text-[10px] opacity-60">{item.senderRole === "ADMIN" ? "پشتیبانی" : selected.customerName} · {date(item.createdAt)}</p>
                  <p className="whitespace-pre-wrap break-words">{item.content}</p>
                </div>
              ))}
            </div>
            {selected.status === "CLOSED" ? (
              <p className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3 text-center text-xs text-zinc-400">این گفت‌وگو بسته شده است. برای پاسخ‌دادن، ابتدا وضعیت آن را تغییر دهید.</p>
            ) : (
              <form onSubmit={sendReply} className="space-y-2">
                <textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={2000} rows={3} placeholder="پاسخ مشتری را بنویسید..." className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm leading-6 outline-none focus:border-cyan-500" />
                <button disabled={saving || !reply.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 py-2.5 text-sm font-bold text-zinc-950 disabled:opacity-40">
                  <FiMessageCircle size={15} /> {saving ? "در حال ارسال..." : "ارسال پاسخ"}
                </button>
              </form>
            )}
            {notice && <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}
          </>}
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300"><FiClock size={17} /></span>
          <div>
            <h2 className="text-sm font-bold">ساعات کاری پشتیبانی</h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">تنظیم هر روز در یک ردیف فشرده · ساعت ایران</p>
          </div>
        </div>
        {settingsLoading ? <p className="text-sm text-zinc-500">در حال دریافت تنظیمات...</p> : (
          <>
            <div className="space-y-1.5">
              {DAYS.map(([key, label]) => (
                <div key={key} className="grid grid-cols-[54px_58px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-2.5 py-2">
                  <span className="text-xs font-semibold text-zinc-200">{label}</span>
                  <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-zinc-400">
                    <input type="checkbox" checked={Boolean(hours[key]?.enabled)} onChange={(event) => changeDay(key, "enabled", event.target.checked)} className="accent-cyan-500" />
                    فعال
                  </label>
                  <label className="flex min-w-0 items-center gap-1 text-[10px] text-zinc-500">
                    <span className="shrink-0">از</span>
                    <input type="time" value={hours[key]?.start || "09:00"} disabled={!hours[key]?.enabled} onChange={(event) => changeDay(key, "start", event.target.value)} className="min-w-0 w-full rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-1.5 text-xs text-white disabled:opacity-30" />
                  </label>
                  <label className="flex min-w-0 items-center gap-1 text-[10px] text-zinc-500">
                    <span className="shrink-0">تا</span>
                    <input type="time" value={hours[key]?.end || "18:00"} disabled={!hours[key]?.enabled} onChange={(event) => changeDay(key, "end", event.target.value)} className="min-w-0 w-full rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-1.5 text-xs text-white disabled:opacity-30" />
                  </label>
                </div>
              ))}
            </div>
            <label className="mt-4 block space-y-1.5 text-xs text-zinc-300">
              متن وضعیت و زمان پاسخگویی
              <textarea value={responseText} onChange={(event) => setResponseText(event.target.value)} maxLength={240} rows={2} placeholder="مثلاً: میانگین زمان پاسخگویی ۱۲ دقیقه است." className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-white outline-none focus:border-cyan-500" />
            </label>
            {settingsError && <p role="alert" className="mt-3 text-xs text-rose-300">{settingsError}</p>}
            {settingsNotice && <p role="status" className="mt-3 text-xs text-emerald-300">{settingsNotice}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[10px] text-zinc-500">تغییرات پس از ذخیره برای مشتریان نمایش داده می‌شود.</span>
              <button type="button" onClick={saveHours} disabled={settingsSaving} className="rounded-lg bg-cyan-500 px-5 py-2 text-xs font-bold text-zinc-950 transition hover:bg-cyan-400 disabled:opacity-50">{settingsSaving ? "در حال ذخیره..." : "ذخیره ساعات کاری"}</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default AdminSupport;
