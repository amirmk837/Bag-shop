import { NavLink } from "react-router-dom";

const navItems = [
  { label: "داشبورد", to: "/admin" },
  { label: "محصولات", to: "/admin/products" },
  { label: "بنرها", to: "/admin/banners" },
  { label: "سفارش‌ها", to: "/admin/orders" },
  { label: "دسته‌بندی‌ها", to: "/admin/categories" },
  { label: "کاربران", to: "/admin/users" },
  { label: "شبکه‌های اجتماعی", to: "/admin/social-links" },
  { label: "تنظیمات پرداخت", to: "/admin/payment-settings" },
  { label: "تنظیمات ارسال", to: "/admin/shipping-methods" },
];

const linkClass = ({ isActive }) =>
  [
    "inline-flex shrink-0 items-center rounded-lg px-3 py-2.5 text-xs font-medium transition sm:text-sm",
    isActive
      ? "bg-cyan-400/10 text-cyan-200 ring-1 ring-inset ring-cyan-400/20"
      : "text-zinc-400 hover:bg-white/[0.05] hover:text-white",
  ].join(" ");

const AdminLayout = ({ children }) => (
  <div className="min-h-screen overflow-x-clip bg-[#0d1119] text-white" dir="rtl">
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#111722]/95 shadow-lg shadow-black/10 backdrop-blur">
      <div className="flex min-h-14 items-center justify-between gap-3 px-3 py-2 sm:px-5 lg:px-6">
        <h1 className="text-base font-bold tracking-tight sm:text-lg">پنل مدیریت</h1>
        <span className="hidden text-xs text-zinc-500 sm:block">مدیریت فروشگاه کاظمی</span>
        <span className="text-[10px] text-zinc-500 sm:hidden">فروشگاه کاظمی</span>
      </div>

      {/* Mobile / tablet navigation */}
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
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>

    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-l border-white/[0.06] bg-[#111722] p-3 lg:sticky lg:top-[57px] lg:block lg:h-[calc(100vh-57px)] lg:w-60">
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
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 w-full flex-1 p-3 sm:p-4 lg:p-6">
        <div className="mx-auto w-full max-w-[1600px] min-w-0">{children}</div>
      </main>
    </div>
  </div>
);

export default AdminLayout;
