import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "داشبورد",
    to: "/admin",
  },
  {
    label: "محصولات",
    to: "/admin/products",
  },
  {
    label: "بنرها",
    to: "/admin/banners",
  },
  {
    label: "سفارش‌ها",
    to: "/admin/orders",
  },
  {
    label: "دسته‌بندی‌ها",
    to: "/admin/categories",
  },
  {
    label: "کاربران",
    to: "/admin/users",
  },
  {
    label: "شبکه‌های اجتماعی",
    to: "/admin/social-links",
  },
  {
    label: "تنظیمات پرداخت",
    to: "/admin/payment-settings",
  },
  {
    label: "تنظیمات ارسال",
    to: "/admin/shipping-methods",
  },
];

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0d1119] text-white" dir="rtl">
      <header className="border-b border-white/[0.06] bg-[#111722] px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-white">پنل مدیریت</h1>

          <span className="text-xs text-zinc-500">مدیریت فروشگاه</span>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-73px)]">
        <aside
          className="
            hidden w-64 shrink-0
            border-l border-white/[0.06]
            bg-[#111722] p-4 md:block
          "
        >
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) =>
                  `
                    block rounded-xl px-4 py-3
                    text-sm transition
                    ${
                      isActive
                        ? "bg-cyan-400/10 font-bold text-cyan-200 ring-1 ring-inset ring-cyan-400/15"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                    }
                  `
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
