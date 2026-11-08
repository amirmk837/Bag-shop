import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import BackPage from "../components/BackPage";

const Cart = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const {
    items,
    totalItems,
    subtotal,
    updateCartItem,
    removeCartItem,
    clearCart,
    loading: cartLoading,
    initialized: cartInitialized,
    loadError: cartLoadError,
    refreshCart,
  } = useCart();

  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const cartItems = Array.isArray(items) ? items : [];

  useEffect(() => {
    if (authLoading || !isAuthenticated || cartInitialized || cartLoading) return;

    refreshCart().catch((requestError) => {
      setError(requestError.message || "دریافت سبد خرید ناموفق بود.");
    });
  }, [authLoading, isAuthenticated, cartInitialized, cartLoading, refreshCart]);

  // اجرای امن عملیات سبد: جلوگیری از کلیک تکراری و نمایش خطا
  const runAction = async (id, action) => {
    if (busyId !== null) return;

    try {
      setBusyId(id);
      setError("");

      await action();
    } catch (requestError) {
      console.error("Cart action error:", requestError);
      setError(requestError.message || "خطا در به‌روزرسانی سبد خرید.");
    } finally {
      setBusyId(null);
    }
  };

  // =========================================
  // بررسی وضعیت Authentication
  // =========================================

  if (authLoading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center px-4 text-zinc-400"
      >
        در حال بررسی حساب کاربری...
      </div>
    );
  }

  // =========================================
  // کاربر مهمان
  // =========================================

  if (!isAuthenticated) {
    return (
      <div dir="rtl" className="min-h-screen px-4 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
          <FiShoppingBag className="mx-auto mb-5 text-5xl text-zinc-500" />

          <h1 className="text-2xl font-bold">
            برای مشاهده سبد خرید وارد حساب شوید
          </h1>

          <p className="mt-3 text-sm leading-7 text-zinc-400">
            برای اضافه کردن محصول به سبد خرید و نگهداری آن، ابتدا وارد حساب
            کاربری خود شوید.
          </p>

          <Link
            to="/login"
            className="mt-7 inline-flex rounded-2xl bg-white px-6 py-3 font-bold text-zinc-900 transition hover:bg-zinc-200"
          >
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  }

  if (isAuthenticated && (cartLoading || !cartInitialized)) {
    return (
      <div dir="rtl" className="flex min-h-[50vh] items-center justify-center text-zinc-400">
        در حال دریافت سبد خرید...
      </div>
    );
  }

  // =========================================
  // سبد خالی
  // =========================================

  if (cartItems.length === 0) {
    return (
      <div dir="rtl" className="min-h-screen px-4 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
          <FiShoppingBag className="mx-auto mb-5 text-6xl text-zinc-600" />

          <h1 className="text-2xl font-bold">{cartLoadError ? "دریافت سبد خرید ناموفق بود" : "سبد خرید شما خالی است"}</h1>

          <p className="mt-3 text-sm text-zinc-400">
            {cartLoadError ? "اتصال به سرور برقرار نشد. اطلاعات سبد خرید حذف نشده است؛ دوباره تلاش کنید." : "هنوز محصولی به سبد خرید اضافه نکرده‌اید."}
          </p>
          {(error || cartLoadError) && <p role="alert" className="mt-3 text-sm text-red-400">{error || cartLoadError}</p>}
          {cartLoadError && (
            <button
              type="button"
              onClick={() => {
                setError("");
                refreshCart().catch((requestError) => setError(requestError.message || "دریافت سبد خرید ناموفق بود."));
              }}
              disabled={cartLoading}
              className="mt-4 inline-flex rounded-xl border border-zinc-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              تلاش دوباره
            </button>
          )}

          <Link
            to="/"
            className="mt-7 inline-flex rounded-2xl bg-white px-6 py-3 font-bold text-zinc-900 transition hover:bg-zinc-200"
          >
            مشاهده محصولات
          </Link>
        </div>
      </div>
    );
  }

  // =========================================
  // سبد خرید
  // =========================================

  const isBusy = busyId !== null;

  return (
    <div
      dir="rtl"
      className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-5"><BackPage fallback="/" /></div>
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">سبد خرید</h1>

            <p className="mt-2 text-sm text-zinc-400">
              {Number(totalItems).toLocaleString("fa-IR")} کالا در سبد خرید شما
            </p>
          </div>

          <button
            type="button"
            onClick={() => runAction("clear", () => clearCart())}
            disabled={isBusy}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-950/60 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiTrash2 />
            خالی کردن سبد
          </button>
        </div>

        {(error || cartLoadError) && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400"
          >
            {error || cartLoadError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {cartItems.map((item, index) => {
              const productCode = item.productCode || "";
              const color = item.color || "";
              const quantity = Number(item.quantity || 0);

              // حداکثر تعداد این ردیف (با احتساب رنگ‌های دیگر همان محصول)
              const maxQuantity = Math.max(
                Number(item.maxQuantity ?? item.availableQuantity ?? 0),
                0,
              );

              const images = Array.isArray(item.images) ? item.images : [];
              const image = images[0] || "";

              const rowBusy = busyId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl"
                >
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <Link
                      to={`/product/${productCode}`}
                      className="mx-auto flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-800 sm:mx-0"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={item.title || "محصول"}
                          loading={index === 0 ? "eager" : "lazy"}
                          fetchPriority={index === 0 ? "high" : "auto"}
                          decoding="async"
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <FiShoppingBag className="text-3xl text-zinc-600" />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link
                            to={`/product/${productCode}`}
                            className="block truncate text-lg font-bold transition hover:text-zinc-300"
                          >
                            {item.title || productCode || "محصول"}
                          </Link>

                          {color && (
                            <p className="mt-2 text-sm text-zinc-300">
                              رنگ:{" "}
                              <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-zinc-200">
                                {color}
                              </span>
                            </p>
                          )}

                          <p className="mt-2 text-xs text-zinc-500">
                            کد محصول: {productCode || "-"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            runAction(item.id, () =>
                              removeCartItem(productCode, color),
                            )
                          }
                          disabled={isBusy}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-red-950/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="حذف محصول"
                        >
                          <FiTrash2 size={20} />
                        </button>
                      </div>

                      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs text-zinc-500">قیمت واحد</p>

                          <p className="mt-1 font-bold">
                            {Number(item.price || 0).toLocaleString("fa-IR")}{" "}
                            تومان
                          </p>
                        </div>

                        <div>
                          <p className="mb-2 text-xs text-zinc-500">تعداد</p>

                          <div className="flex w-fit items-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
                            <button
                              type="button"
                              onClick={() =>
                                runAction(item.id, () =>
                                  updateCartItem(
                                    productCode,
                                    quantity - 1,
                                    color,
                                  ),
                                )
                              }
                              disabled={quantity <= 1 || isBusy}
                              aria-label="کم کردن تعداد"
                              className="flex h-10 w-10 items-center justify-center transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <FiMinus />
                            </button>

                            <span className="flex h-10 min-w-12 items-center justify-center border-x border-zinc-700 px-3 font-bold">
                              {rowBusy ? "…" : quantity.toLocaleString("fa-IR")}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                runAction(item.id, () =>
                                  updateCartItem(
                                    productCode,
                                    quantity + 1,
                                    color,
                                  ),
                                )
                              }
                              disabled={quantity >= maxQuantity || isBusy}
                              aria-label="زیاد کردن تعداد"
                              className="flex h-10 w-10 items-center justify-center transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <FiPlus />
                            </button>
                          </div>

                          <p className="mt-2 text-xs text-zinc-600">
                            حداکثر قابل انتخاب:{" "}
                            {maxQuantity.toLocaleString("fa-IR")}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-xs text-zinc-500">مبلغ</p>

                          <p className="mt-1 text-lg font-black">
                            {Number(item.subtotal || 0).toLocaleString("fa-IR")}{" "}
                            تومان
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="h-fit rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl lg:sticky lg:top-24">
            <h2 className="text-xl font-bold">خلاصه سفارش</h2>

            <div className="mt-6 space-y-4 border-b border-zinc-800 pb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">تعداد کالا</span>

                <span>{Number(totalItems).toLocaleString("fa-IR")}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">مبلغ محصولات</span>

                <span>{Number(subtotal).toLocaleString("fa-IR")} تومان</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">هزینه ارسال</span>

                <span className="text-zinc-500">در مرحله پرداخت</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="font-bold">مبلغ قابل پرداخت</span>

              <span className="text-xl font-black">
                {Number(subtotal).toLocaleString("fa-IR")} تومان
              </span>
            </div>

            <Link
              to="/checkout"
              className="mt-6 flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 font-bold text-zinc-900 transition hover:bg-zinc-200"
            >
              ادامه فرایند خرید
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;
