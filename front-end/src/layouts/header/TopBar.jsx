import { FiShoppingCart, FiUser } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import HamburgerMenu from "./HamburgerMenu";
import { useEffect, useState } from "react";
import { getSiteSettings } from "../../services/siteSettingsApi";

const TopBar = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { totalItems } = useCart();

  const [site, setSite] = useState(null);
  useEffect(() => { getSiteSettings().then(setSite).catch(() => {}); }, []);

  const cartCount = Number(totalItems || 0);
  const showCart = !loading && user?.role !== "ADMIN";
  const accountPath = !user ? "/login" : user.role === "ADMIN" ? "/admin" : "/account";

  return (
    <div className="container mx-auto w-full px-3 sm:px-5">
      <div
        dir="rtl"
        className="relative flex items-center justify-between gap-2 py-3 sm:py-4 md:py-5"
      >
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <HamburgerMenu />

          {!loading && (
            <Link
              to={accountPath}
              aria-label={user ? "رفتن به حساب کاربری" : "ورود به حساب کاربری"}
              title={user ? "حساب کاربری" : "ورود"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <FiUser size={21} />
            </Link>
          )}

          {showCart && (
            <button
              type="button"
              onClick={() => navigate("/cart")}
              aria-label="سبد خرید"
              className="
                relative flex h-10 w-10 shrink-0 items-center
                justify-center rounded-xl text-zinc-300
                transition duration-300 hover:bg-white/10
                hover:text-white
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-white/60
              "
            >
              <FiShoppingCart size={21} />

              {cartCount > 0 && (
                <span
                  className="
                    absolute -right-0.5 -top-0.5 flex min-h-5
                    min-w-5 items-center justify-center
                    rounded-full bg-white px-1 text-[10px]
                    font-black leading-none text-zinc-900
                  "
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          )}
        </div>

        <Link
          to="/"
          aria-label={`صفحه اصلی ${site?.storeName || "فروشگاه کاظمی"}`}
          className="
            absolute left-1/2 top-1/2 flex -translate-x-1/2
            -translate-y-1/2 items-center gap-2 rounded-xl p-1
            transition-opacity duration-300 hover:opacity-80
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-white/60
          "
        >
          <img
            src={site?.logoUrl ? `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}${site.logoUrl}` : "/images/brand-logo.svg"}
            alt=""
            className="h-10 w-10 object-contain sm:h-12 sm:w-12"
          />

          <span className="hidden min-w-0 text-right sm:block">
            <span className="block whitespace-nowrap text-sm font-bold text-white md:text-base">
              {site?.storeName || "فروشگاه کاظمی"}
            </span>
            {site?.headerText && (
              <span className="mt-0.5 block max-w-56 truncate text-[10px] text-zinc-400 md:text-xs">
                {site.headerText}
              </span>
            )}
          </span>
        </Link>
      </div>
    </div>
  );
};

export default TopBar;
