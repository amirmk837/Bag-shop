import { NavLink } from "react-router-dom";

const AdminLayout = ({ children }) => {
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
      label: "افزودن محصول",
      to: "/admin/products/create",
    },
    {
      label: "دسته‌بندی‌ها",
      to: "/admin/categories",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white" dir="rtl">
      {/* ============================================ */}
      {/* Header */}
      {/* ============================================ */}

      <header className="border-b border-zinc-800 bg-zinc-900 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">پنل مدیریت</h1>

          <span className="text-sm text-zinc-500">مدیریت فروشگاه</span>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-73px)]">
        {/* ========================================== */}
        {/* Sidebar */}
        {/* ========================================== */}

        <aside
          className="
            hidden
            w-64
            shrink-0
            border-l
            border-zinc-800
            bg-zinc-900
            p-4
            md:block
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
                    block
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    transition
                    ${
                      isActive
                        ? "bg-white font-bold text-zinc-900"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }
                  `
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* ========================================== */}
        {/* Main */}
        {/* ========================================== */}

        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
