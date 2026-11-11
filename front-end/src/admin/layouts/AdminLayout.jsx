import { Link, NavLink, useLocation } from "react-router-dom";
import { FiExternalLink } from "react-icons/fi";
import BackPage from "../../components/BackPage";
import { useEffect, useState } from "react";
import { getAdminFeedbackSummary } from "../../services/feedbackApi";
import ThemeToggle from "../../components/ThemeToggle";

const navItems = [
  { label: "داشبورد", to: "/admin" },
  { label: "محصولات", to: "/admin/products" },
  { label: "تخفیف‌ها", to: "/admin/discounts" },
  { label: "بنرها", to: "/admin/banners" },
  { label: "سفارش‌ها", to: "/admin/orders" },
  {
    label: "نظرات و پرسش‌ها",
    to: "/admin/product-comments",
    badgeKey: "pendingComments",
  },
  {
    label: "پشتیبانی مشتریان",
    to: "/admin/support",
    badgeKey: "unansweredTickets",
  },
  { label: "دسته‌بندی‌ها", to: "/admin/categories" },
  { label: "کاربران", to: "/admin/users" },
  { label: "بازدیدکنندگان و آمار", to: "/admin/analytics" },
  { label: "تنظیمات ظاهری سایت", to: "/admin/site-settings" },
  { label: "شبکه‌های اجتماعی", to: "/admin/social-links" },
  { label: "تنظیمات پرداخت", to: "/admin/payment-settings" },
  { label: "تنظیمات ارسال", to: "/admin/shipping-methods" },
  { label: "نمادهای اعتماد فوتر", to: "/admin/footer-trust-badges" },
];

const linkClass = ({ isActive }) =>
  [
    "inline-flex shrink-0 items-center rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm",
    isActive
      ? "bg-cyan-400/10 text-cyan-200 ring-1 ring-inset ring-cyan-400/20"
      : "text-zinc-400 hover:bg-white/[0.05] hover:text-white",
  ].join(" ");

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname === "/admin";
  const [summary, setSummary] = useState({});

  useEffect(() => {
    let active = true;
    const loadSummary = async () => {
      try {
        const result = await getAdminFeedbackSummary();
        if (active) setSummary(result || {});
      } catch {
        if (active) setSummary({});
      }
    };
    loadSummary();
    const timer = window.setInterval(loadSummary, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const renderBadge = (item) => {
    const count = Number(summary[item.badgeKey] || 0);
    return item.badgeKey && count > 0 ? (
      <span className="mr-auto rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-rose-300">
        {count > 99 ? "۹۹+" : count.toLocaleString("fa-IR")}
      </span>
    ) : null;
  };

  return (
    <div
      className="admin-theme-scope admin-layout-shell min-h-screen overflow-x-clip bg-[#0d1119] text-white"
      dir="rtl"
    >
      <header className="admin-header-shell sticky top-0 z-40 border-b border-white/[0.07] bg-[#111722]/95 shadow-lg shadow-black/10 backdrop-blur">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-3 py-2 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src="/images/brand-logo.svg"
              alt="لوگوی فروشگاه کاظمی"
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight sm:text-base">
                پنل مدیریت
              </h1>
              <p className="hidden text-[10px] text-zinc-500 sm:block">
                فروشگاه کاظمی
              </p>
            </div>
            {!isDashboard && <BackPage fallback="/admin" />}
          </div>

          <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
          >
            <FiExternalLink size={14} />
            مشاهده فروشگاه
          </Link>
          </div>
        </div>

        <nav
          aria-label="منوی پنل مدیریت"
          className="flex gap-1 overflow-x-auto border-t border-white/[0.05] px-2 py-2 md:hidden"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={linkClass}
            >
              <span>{item.label}</span>
              {renderBadge(item)}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="flex min-h-[calc(100vh-57px)]">
        <aside className="admin-sidebar-shell hidden w-56 shrink-0 border-l border-white/[0.06] bg-[#111722] p-3 lg:sticky lg:top-[57px] lg:block lg:h-[calc(100vh-57px)] lg:w-60">
          <nav aria-label="منوی پنل مدیریت" className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) =>
                  [
                    "flex w-full items-center rounded-lg px-3 py-2.5 text-sm transition",
                    isActive
                      ? "bg-cyan-400/10 font-semibold text-cyan-200 ring-1 ring-inset ring-cyan-400/20"
                      : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100",
                  ].join(" ")
                }
              >
                <span>{item.label}</span>
                {renderBadge(item)}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 w-full flex-1 p-3 sm:p-4 lg:p-5">
          <div className="admin-content-surface mx-auto w-full max-w-[1600px] min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
