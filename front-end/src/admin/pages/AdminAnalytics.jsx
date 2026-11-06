import { useCallback, useEffect, useState } from "react";
import { getAnalyticsReport, getLoggedInUsers } from "../../services/adminAnalyticsApi";

const number = (value) => Number(value || 0).toLocaleString("fa-IR");
const date = (value) => value ? new Date(value).toLocaleString("fa-IR") : "—";

function Metric({ title, value, note }) {
  return <section className="rounded-2xl border border-white/10 bg-[#151d2a] p-4">
    <p className="text-sm text-zinc-400">{title}</p>
    <p className="mt-3 text-2xl font-black text-white">{number(value)}</p>
    {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
  </section>;
}

function BarList({ title, rows, labelKey, valueKey }) {
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey] || 0)));
  return <section className="rounded-2xl border border-white/10 bg-[#151d2a] p-4">
    <h3 className="mb-4 font-bold text-white">{title}</h3>
    {rows.length ? <div className="space-y-4">{rows.map((row, index) => <div key={row[labelKey] || index}>
      <div className="mb-1 flex justify-between gap-3 text-xs">
        <span className="min-w-0 truncate text-zinc-300">{row[labelKey]}</span>
        <span className="shrink-0 text-zinc-400">{number(row[valueKey])}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(2, Number(row[valueKey] || 0) / max * 100)}%` }} />
      </div>
    </div>)}</div> : <p className="text-sm text-zinc-500">هنوز داده‌ای ثبت نشده است.</p>}
  </section>;
}

export default function AdminAnalytics() {
  const [days, setDays] = useState("30");
  const [report, setReport] = useState(null);
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [analytics, loggedUsers] = await Promise.all([
        getAnalyticsReport(days), getLoggedInUsers({ page: 1, pageSize: 20 }),
      ]);
      setReport(analytics); setUsers(loggedUsers);
    } catch (e) { setError(e.message || "دریافت آمار ناموفق بود."); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);
  const maxDaily = Math.max(1, ...(report?.daily || []).map((item) => Number(item.views || 0)));

  return <div dir="rtl" className="space-y-6 text-white">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-black">بازدیدکنندگان و آمار سایت</h2>
        <p className="mt-2 text-sm text-zinc-400">گزارش بازدیدها و حساب‌های کاربری واردشده</p></div>
      <div className="flex gap-2">
        <select value={days} onChange={(e) => setDays(e.target.value)} className="rounded-xl border border-white/10 bg-[#151d2a] px-3 py-2 text-sm">
          <option value="7">۷ روز اخیر</option><option value="30">۳۰ روز اخیر</option><option value="90">۹۰ روز اخیر</option>
        </select>
        <button onClick={load} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950">به‌روزرسانی</button>
      </div>
    </header>
    {error && <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
    {loading && !report ? <div className="rounded-xl bg-[#151d2a] p-8 text-center text-zinc-400">در حال دریافت آمار...</div> : report && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="بازدید صفحات" value={report.summary.pageViews} />
        <Metric title="بازدیدکنندگان یکتا" value={report.summary.uniqueVisitors} />
        <Metric title="کاربران شناسایی‌شده" value={report.summary.identifiedUsers} note="بر اساس نشست ورود معتبر" />
        <Metric title="بازدید صفحات ناشناس" value={report.summary.anonymousPageViews} />
      </div>
      <section className="rounded-2xl border border-white/10 bg-[#151d2a] p-4">
        <h3 className="mb-5 font-bold">روند بازدید روزانه</h3>
        {report.daily.length ? <div className="flex h-52 items-end gap-1 overflow-x-auto pb-6">
          {report.daily.map((item) => <div key={item.day} className="group relative flex h-full min-w-5 flex-1 items-end">
            <div title={`${item.day}: ${item.views} بازدید`} className="w-full rounded-t bg-cyan-400/80 hover:bg-cyan-300" style={{ height: `${Math.max(2, Number(item.views) / maxDaily * 100)}%` }} />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-zinc-500">{item.day.slice(5)}</span>
          </div>)}
        </div> : <p className="text-sm text-zinc-500">هنوز داده‌ای ثبت نشده است.</p>}
      </section>
      <div className="grid gap-4 xl:grid-cols-3">
        <BarList title="صفحات پربازدید" rows={report.topPages} labelKey="path" valueKey="views" />
        <BarList title="منابع ورود" rows={report.sources} labelKey="source" valueKey="views" />
        <BarList title="دستگاه و سیستم‌عامل" rows={report.devices.map((d) => ({ ...d, label: `${d.device} / ${d.os}` }))} labelKey="label" valueKey="views" />
      </div>
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#151d2a]">
        <div className="border-b border-white/10 p-4"><h3 className="font-bold">آخرین بازدیدکنندگان</h3><p className="mt-1 text-xs text-zinc-500">شناسه ناشناس مرورگر ذخیره یا نمایش داده نمی‌شود.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right text-sm">
          <thead className="bg-black/20 text-zinc-400"><tr>{["کاربر","صفحه آخر","دستگاه","سیستم‌عامل","آخرین بازدید"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{report.recentVisitors.map((v, i) => <tr key={`${v.visitorId}-${v.userId || "guest"}-${i}`} className="border-t border-white/5">
            <td className="px-4 py-3">{v.username ? <><span className="text-white">{v.username}</span><span className="block text-xs text-zinc-500">{v.phone || "بدون شماره"}</span></> : <span className="text-zinc-400">بازدیدکننده ناشناس</span>}</td>
            <td className="px-4 py-3" dir="ltr">{v.path}</td><td className="px-4 py-3">{v.deviceType}</td><td className="px-4 py-3">{v.operatingSystem}</td><td className="px-4 py-3">{date(v.createdAt)}</td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </>}
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#151d2a]">
      <div className="border-b border-white/10 p-4"><h3 className="font-bold">کاربرانی که وارد حساب شده‌اند</h3><p className="mt-1 text-xs text-zinc-500">آخرین ورود ثبت‌شده برای حساب‌های کاربری</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-right text-sm">
        <thead className="bg-black/20 text-zinc-400"><tr>{["نام کاربری","شماره تماس","نقش","تاریخ ثبت‌نام","آخرین ورود"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
        <tbody>{(users?.items || []).map((u) => <tr key={u.id} className="border-t border-white/5"><td className="px-4 py-3">{u.username}</td><td className="px-4 py-3">{u.phone || "—"}</td><td className="px-4 py-3">{u.role === "ADMIN" ? "مدیر" : "کاربر"}</td><td className="px-4 py-3">{date(u.createdAt)}</td><td className="px-4 py-3">{date(u.lastLoginAt)}</td></tr>)}
          {!users?.items?.length && <tr><td colSpan="5" className="p-6 text-center text-zinc-500">هنوز ورود ثبت‌شده‌ای وجود ندارد.</td></tr>}</tbody>
      </table></div>
    </section>
  </div>;
}
