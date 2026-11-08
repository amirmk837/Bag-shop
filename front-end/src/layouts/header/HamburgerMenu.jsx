import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiLogIn,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiShoppingBag,
  FiUser,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const HamburgerMenu = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [previousPathname, setPreviousPathname] = useState(location.pathname);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const closeMenu = () => setOpen(false);

  if (previousPathname !== location.pathname) {
    setPreviousPathname(location.pathname);
    setOpen(false);
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape" && open) {
        closeMenu();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleLogout = async () => {
    closeMenu();

    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const panelClass = open
    ? "visible translate-y-0 scale-100 opacity-100"
    : "invisible pointer-events-none -translate-y-2 scale-[0.98] opacity-0";

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label={open ? "بستن منو" : "باز کردن منو"}
        aria-expanded={open}
        aria-controls="account-menu"
        className="
          flex h-11 w-11 items-center justify-center
          rounded-xl border border-white/10 bg-white/5
          text-zinc-200 transition duration-300
          hover:border-white/25 hover:bg-white/10 hover:text-white
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-white/60
          motion-reduce:transition-none
        "
      >
        <span
          className={`
            transition-transform duration-300
            motion-reduce:transition-none
            ${open ? "rotate-90" : "rotate-0"}
          `}
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </span>
      </button>

      <div
        id="account-menu"
        dir="rtl"
        aria-hidden={!open}
        inert={!open}
        className={`
          absolute right-0 top-[calc(100%+0.75rem)] z-[100]
          w-[min(18rem,calc(100vw-1.5rem))]
          origin-top overflow-hidden rounded-2xl
          border border-white/10 bg-zinc-950/95 p-2
          text-right shadow-2xl shadow-black/40 backdrop-blur-xl
          transition-[opacity,transform,visibility]
          duration-250 ease-out
          motion-reduce:transform-none motion-reduce:transition-none
          ${panelClass}
        `}
      >
        {loading ? (
          <p className="px-3 py-4 text-sm text-zinc-400">
            در حال بررسی حساب...
          </p>
        ) : isAuthenticated ? (
          <>
            <div
              className={`
                border-b border-white/10 px-3 py-3
                transition duration-300 motion-reduce:transition-none
                ${open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}
              `}
            >
              <p className="text-xs text-zinc-500">حساب کاربری</p>
              <p className="mt-1 truncate font-bold text-white">
                {user?.username || "کاربر"}
              </p>
            </div>

            {user?.role === "ADMIN" ? (
              <MenuLink
                to="/admin"
                icon={<FiSettings />}
                label="پنل مدیریت"
                onClick={closeMenu}
                open={open}
                delay={50}
              />
            ) : (
              <>
                <MenuLink
                  to="/account"
                  icon={<FiUser />}
                  label="حساب کاربری"
                  onClick={closeMenu}
                  open={open}
                  delay={50}
                />

                <MenuLink
                  to="/cart"
                  icon={<FiShoppingBag />}
                  label="سبد خرید"
                  onClick={closeMenu}
                  open={open}
                  delay={100}
                />
              </>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={`
                flex w-full items-center gap-3 rounded-xl
                px-3 py-3 text-right text-sm text-red-400
                transition-all duration-300
                hover:bg-red-950/40 hover:text-red-300
                motion-reduce:transition-none
                ${open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}
              `}
              style={{ transitionDelay: open ? "150ms" : "0ms" }}
            >
              <FiLogOut size={18} />
              خروج از حساب
            </button>
          </>
        ) : (
          <>
            <MenuLink
              to="/login"
              icon={<FiLogIn />}
              label="ورود"
              onClick={closeMenu}
              open={open}
              delay={50}
            />

            <MenuLink
              to="/register"
              icon={<FiUserPlus />}
              label="ثبت‌نام"
              onClick={closeMenu}
              open={open}
              delay={100}
            />
          </>
        )}
      </div>
    </div>
  );
};

const MenuLink = ({ to, icon, label, onClick, open, delay = 0 }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`
      flex items-center gap-3 rounded-xl px-3 py-3
      text-sm text-zinc-300 transition-all duration-300
      hover:bg-white/10 hover:text-white
      focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-white/40
      motion-reduce:transition-none motion-reduce:transform-none
      ${open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}
    `}
    style={{ transitionDelay: open ? `${delay}ms` : "0ms" }}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </Link>
);

export default HamburgerMenu;
