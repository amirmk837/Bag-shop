import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiShoppingCart,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/useCart";

const TOAST_DURATION = 5000;

const AddToCartButton = ({
  productCode,
  productTitle = "",
  productImage = "",
  color = "",
  requireColor = false,
  disabled = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [previousColor, setPreviousColor] = useState(color);

  const [toast, setToast] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);

  const hideTimer = useRef(null);
  const removeTimer = useRef(null);
  const successTimer = useRef(null);

  // با تغییر رنگ، پیام خطای مربوط به انتخاب قبلی پاک می‌شود.
  if (previousColor !== color) {
    setPreviousColor(color);
    setError("");
  }

  // پاک‌سازی تایمرها هنگام خروج از صفحه
  useEffect(() => {
    return () => {
      clearTimeout(hideTimer.current);
      clearTimeout(removeTimer.current);
      clearTimeout(successTimer.current);
    };
  }, []);

  if (user?.role === "ADMIN") {
    return null;
  }

  const closeToast = () => {
    clearTimeout(hideTimer.current);
    setToastVisible(false);

    removeTimer.current = setTimeout(() => setToast(null), 500);
  };

  const showToast = () => {
    clearTimeout(hideTimer.current);
    clearTimeout(removeTimer.current);

    setToast({ title: productTitle, color, image: productImage });

    // یک فریم صبر می‌کنیم تا انیمیشن ورود اجرا شود
    requestAnimationFrame(() => setToastVisible(true));

    hideTimer.current = setTimeout(closeToast, TOAST_DURATION);
  };

  const handleAddToCart = async () => {
    setError("");
    setSuccess(false);

    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    if (!productCode || disabled || loading) {
      return;
    }

    if (requireColor && !color) {
      setError("لطفاً ابتدا یک رنگ برای محصول انتخاب کنید.");
      return;
    }

    try {
      setLoading(true);

      await addToCart(productCode, 1, color);

      setSuccess(true);
      clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccess(false), 1800);

      showToast();
    } catch (requestError) {
      console.error("Add to cart error:", requestError);
      setError(requestError.message || "خطا در افزودن محصول به سبد خرید");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading || disabled}
        className="
          flex w-full items-center justify-center gap-2
          rounded-2xl bg-white px-5 py-3.5
          font-bold text-zinc-900 transition
          hover:bg-zinc-200
          disabled:cursor-not-allowed disabled:opacity-50
        "
      >
        {success ? (
          <>
            <FiCheck size={20} />
            به سبد اضافه شد
          </>
        ) : loading ? (
          "در حال افزودن..."
        ) : (
          <>
            <FiShoppingCart size={20} />
            افزودن به سبد خرید
          </>
        )}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}

      {/* SUCCESS TOAST */}

      {toast && (
        <div
          dir="rtl"
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-4 left-4 z-50 w-[calc(100%-2rem)] max-w-sm"
        >
          <div
            className={`
              pointer-events-auto relative overflow-hidden
              rounded-2xl border border-zinc-700 bg-zinc-900
              p-4 text-right shadow-2xl shadow-black/40
              transition-all duration-500 ease-out
              ${
                toastVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }
            `}
          >
            <div className="flex items-start gap-3">
              {toast.image ? (
                <div className="relative shrink-0">
                  <img
                    src={toast.image}
                    alt={toast.title}
                    className="h-14 w-14 rounded-xl border border-zinc-700 bg-zinc-950 object-contain p-1"
                  />

                  <span className="absolute -bottom-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-zinc-900 bg-emerald-500 text-zinc-950">
                    <FiCheck size={11} strokeWidth={3} />
                  </span>
                </div>
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <FiCheckCircle size={20} />
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-bold text-white">به سبد خرید اضافه شد</p>

                {toast.title && (
                  <p className="text-sm leading-6 text-zinc-300">
                    {toast.title}
                  </p>
                )}

                {toast.color && (
                  <p className="text-sm text-zinc-400">
                    رنگ: <span className="text-zinc-200">{toast.color}</span>
                  </p>
                )}

                <p className="pt-1 text-sm text-zinc-400">
                  مشاهده{" "}
                  <Link
                    to="/cart"
                    onClick={closeToast}
                    className="inline-flex items-center gap-1 font-bold text-emerald-400 transition hover:text-emerald-300"
                  >
                    سبد خرید
                    <FiArrowLeft size={14} />
                  </Link>
                </p>
              </div>

              <button
                type="button"
                onClick={closeToast}
                aria-label="بستن"
                className="shrink-0 rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* نوار زمان */}
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-zinc-800">
              <div
                className="h-full bg-emerald-500"
                style={{
                  width: toastVisible ? "0%" : "100%",
                  transition: toastVisible
                    ? `width ${TOAST_DURATION}ms linear`
                    : "none",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToCartButton;
