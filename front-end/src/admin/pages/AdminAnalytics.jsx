import { useCallback, useEffect, useRef, useState } from "react";
import { getAnalyticsReport, getLoggedInUsers } from "../../services/adminAnalyticsApi";

const number = (value) => Number(value || 0).toLocaleString("fa-IR");
const money = (value) => `${number(value)} تومان`;
const date = (value) => value ? new Date(value).toLocaleString("fa-IR") : "—";

const STATUS_LABELS = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  CONFIRMED: "تأییدشده",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELLED: "لغوشده",
};

const STATUS_TONES = {
  PENDING: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  PAID: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  CONFIRMED: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  PROCESSING: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  SHIPPED: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  DELIVERED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  CANCELLED: "border-red-500/20 bg-red-500/10 text-red-300",
};

function Metric({ title, value, note }) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-[#151d2a] p-4">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-3 break-words text-xl font-black text-white sm:text-2xl">{value}</p>
      {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
    </section>
  );
}

function Slider({ title, description, children, empty, isEmpty = false }) {
  const trackRef = useRef(null);
  const move = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(220, track.clientWidth * 0.75), behavior: "smooth" });
  };

  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-[#151d2a] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
        </div>
        <div className="flex shrink-0 gap-2" dir="ltr">
          <button type="button" onClick={() => move(-1)} aria-label="اسلاید قبلی" className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-300 hover:bg-white/5">‹</button>
          <button type="button" onClick={() => move(1)} aria-label="اسلاید بعدی" className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-300 hover:bg-white/5">›</button>
        </div>
      </div>
      {isEmpty ? <p className="py-5 text-center text-sm text-zinc-500">{empty}</p> : (
        <div ref={trackRef} dir="ltr" className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {children}
        </div>
      )}
    </section>
  );
}

function SlideCard({ children, className = "" }) {
  return <div dir="rtl" className={`w-[78%] min-w-[78%] snap-start rounded-xl border border-white/10 bg-[#101722] p-4 sm:w-[42%] sm:min-w-[42%] lg:w-[30%] lg:min-w-[30%] ${className}`}>{children}</div>;
}

export default function AdminAnalytics() {
  const [days, setDays] = useState("30");
  const [report, setReport] = useState(null);
  const [users, setUsers] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [analytics, loggedUsers] = await Promise.all([
        getAnalyticsReport(days),
        getLoggedInUsers({ page: userPage, pageSize: 20 }),
      ]);
      setReport(analytics);
      setUsers(loggedUsers);
    } catch (e) {
      setError(e.message || "دریافت گزارش مدیریتی ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, [days, userPage]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <div dir="rtl" className="space-y-6 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">گزارش عملکرد فروشگاه</h2>
          <p className="mt-2 text-sm text-zinc-400">شاخص‌های فروش، سفارش‌ها، محصولات و مشتریان</p>
        </div>
        <div className="flex gap-2">
          <select value={days} onChange={(e) => setDays(e.target.value)} className="rounded-xl border border-white/10 bg-[#151d2a] px-3 py-2 text-sm">
            <option value="7">۷ روز اخیر</option>
            <option value="30">۳۰ روز اخیر</option>
            <option value="90">۹۰ روز اخیر</option>
          </select>
          <button type="button" onClick={load} disabled={loading} className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">
            {loading ? "در حال دریافت..." : "به‌روزرسانی"}
          </button>
        </div>
      </header>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
      {loading && !report ? (
        <div className="rounded-xl bg-[#151d2a] p-8 text-center text-zinc-400">در حال دریافت گزارش...</div>
      ) : report && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="مبلغ سفارش‌های موفق" value={money(report.summary.paidRevenue)} note="شامل پرداخت‌شده تا تحویل‌شده" />
            <Metric title="تعداد سفارش‌های موفق" value={number(report.summary.paidOrders)} note="سفارش‌های لغوشده و در انتظار پرداخت محاسبه نشده‌اند" />
            <Metric title="میانگین مبلغ هر سفارش" value={money(report.summary.averageOrderValue)} />
            <Metric title="سفارش‌های ثبت‌شده" value={number(report.summary.totalOrders)} note="با تمام وضعیت‌ها در بازه انتخابی" />
            <Metric title="مشتریان جدید" value={number(report.summary.newCustomers)} note="ثبت‌نام در بازه انتخابی" />
            <Metric title="کل مشتریان" value={number(report.summary.totalCustomers)} note="حساب‌های مشتری فعال و حذف‌نشده" />
            <Metric title="در انتظار پرداخت" value={number(report.summary.pendingOrders)} note="نیازمند بررسی وضعیت پرداخت" />
            <Metric title="سفارش‌های لغوشده" value={number(report.summary.cancelledOrders)} note="در بازه انتخابی" />
            <Metric title="بازدید صفحات" value={number(report.siteVisits?.summary?.pageViews)} note="بازدیدهای ثبت‌شده در بازه انتخابی" />
            <Metric title="بازدیدکنندگان یکتا" value={number(report.siteVisits?.summary?.uniqueVisitors)} note="شناسه‌های ناشناس بازدیدکننده" />
          </div>

          <Slider title="روند بازدید روزانه" description="تعداد بازدید صفحات و بازدیدکنندگان یکتا به تفکیک روز" empty="هنوز بازدیدی در این بازه ثبت نشده است." isEmpty={!report.siteVisits?.daily?.length}>
            {(report.siteVisits?.daily || []).map((day) => (
              <SlideCard key={day.date}>
                <p className="text-sm font-semibold">{new Date(`${day.date}T12:00:00`).toLocaleDateString("fa-IR")}</p>
                <p className="mt-3 text-2xl font-black">{number(day.pageViews)}</p>
                <p className="mt-1 text-xs text-zinc-500">بازدید صفحه</p>
                <p className="mt-3 text-lg font-bold text-cyan-300">{number(day.uniqueVisitors)}</p>
                <p className="mt-1 text-xs text-zinc-500">بازدیدکننده یکتا</p>
              </SlideCard>
            ))}
          </Slider>

          <Slider title="محبوب‌ترین محصولات" description="رتبه‌بندی بر اساس تعداد بازدید صفحه جزئیات محصول در بازه انتخابی" empty="در این بازه هنوز بازدیدی از صفحه جزئیات محصولات ثبت نشده است." isEmpty={!report.mostViewedProducts?.length}>
            {(report.mostViewedProducts || []).map((item, index) => (
              <SlideCard key={item.productCode}>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-lg bg-violet-500/10 px-2 py-1 text-xs font-bold text-violet-300">رتبه {number(index + 1)}</span>
                  <span className="text-xs text-zinc-500" dir="ltr">{item.productCode}</span>
                </div>
                <p className="mt-4 line-clamp-2 min-h-10 font-bold text-white">{item.title}</p>
                <p className="mt-3 text-lg font-black text-violet-300">{number(item.viewCount)} بازدید</p>
                <p className="mt-1 text-xs text-zinc-500">{number(item.uniqueVisitors)} بازدیدکننده یکتا</p>
              </SlideCard>
            ))}
          </Slider>


          <Slider title="وضعیت سفارش‌ها" description="توزیع سفارش‌های ثبت‌شده در بازه انتخابی" empty="در این بازه سفارشی ثبت نشده است." isEmpty={!report.orderStatuses?.length}>
            {(report.orderStatuses || []).map((item) => (
              <SlideCard key={item.status} className={STATUS_TONES[item.status] || ""}>
                <p className="text-sm font-semibold">{STATUS_LABELS[item.status] || item.status}</p>
                <p className="mt-3 text-3xl font-black">{number(item.count)}</p>
                <p className="mt-1 text-xs opacity-70">سفارش</p>
              </SlideCard>
            ))}
          </Slider>

          <Slider title="محصولات پرفروش" description="بر اساس تعداد اقلام فروخته‌شده در سفارش‌های موفق" empty="هنوز فروش موفقی در این بازه ثبت نشده است." isEmpty={!report.bestSellingProducts?.length}>
            {(report.bestSellingProducts || []).map((item, index) => (
              <SlideCard key={item.productCode}>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-lg bg-cyan-500/10 px-2 py-1 text-xs font-bold text-cyan-300">رتبه {number(index + 1)}</span>
                  <span className="text-xs text-zinc-500" dir="ltr">{item.productCode}</span>
                </div>
                <p className="mt-4 line-clamp-2 min-h-10 font-bold text-white">{item.title}</p>
                <p className="mt-3 text-sm text-zinc-400">{number(item.quantitySold)} عدد فروش</p>
                <p className="mt-1 text-sm font-bold text-emerald-300">{money(item.revenue)}</p>
              </SlideCard>
            ))}
          </Slider>
        </>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#151d2a]">
        <div className="border-b border-white/10 p-4">
          <h3 className="font-bold">کاربرانی که وارد حساب شده‌اند</h3>
          <p className="mt-1 text-xs text-zinc-500">مرتب‌شده بر اساس آخرین ورود موفق ثبت‌شده</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-right text-sm">
            <thead className="bg-black/20 text-zinc-400">
              <tr>{["نام کاربری", "شماره تماس", "نقش", "تاریخ ثبت‌نام", "آخرین ورود"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(users?.items || []).map((user) => (
                <tr key={user.id} className="border-t border-white/5">
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3">{user.phone || "—"}</td>
                  <td className="px-4 py-3">{user.role === "ADMIN" ? "مدیر" : "مشتری"}</td>
                  <td className="px-4 py-3">{date(user.createdAt)}</td>
                  <td className="px-4 py-3">{date(user.lastLoginAt)}</td>
                </tr>
              ))}
              {!users?.items?.length && <tr><td colSpan="5" className="p-6 text-center text-zinc-500">هنوز ورود ثبت‌شده‌ای وجود ندارد.</td></tr>}
            </tbody>
          </table>
        </div>
        {users?.pagination?.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/10 p-3 text-xs text-zinc-400">
            <button type="button" disabled={userPage <= 1} onClick={() => setUserPage((page) => page - 1)} className="rounded-lg bg-zinc-800 px-3 py-2 disabled:opacity-40">قبلی</button>
            <span>صفحه {number(userPage)} از {number(users.pagination.totalPages)}</span>
            <button type="button" disabled={userPage >= users.pagination.totalPages} onClick={() => setUserPage((page) => page + 1)} className="rounded-lg bg-zinc-800 px-3 py-2 disabled:opacity-40">بعدی</button>
          </div>
        )}
      </section>
    </div>
  );
}
