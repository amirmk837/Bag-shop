import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BackPage from "../../components/BackPage";
import { getCustomerOrders } from "../../services/orderApi";

const STATUS_LABELS = {
  PENDING: "در انتظار پرداخت",
  CONFIRMED: "تأیید شده",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
};

const PAYMENT_LABELS = {
  NOT_FOUND: "اطلاعات پرداخت موجود نیست",
  PENDING: "در انتظار پرداخت",
  SUCCESS: "پرداخت موفق",
  VERIFIED: "پرداخت تأیید شده",
  FAILED: "پرداخت ناموفق",
  CANCELLED: "پرداخت لغو شده",
};

const STATUS_STYLES = {
  PENDING: "bg-amber-950 text-amber-300",
  CONFIRMED: "bg-blue-950 text-blue-300",
  PROCESSING: "bg-indigo-950 text-indigo-300",
  SHIPPED: "bg-cyan-950 text-cyan-300",
  DELIVERED: "bg-emerald-950 text-emerald-300",
  CANCELLED: "bg-red-950 text-red-300",
};

const formatDate = (value) => {
  if (!value) return "ثبت نشده";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "نامشخص";

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatPrice = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "نامشخص";

  return `${amount.toLocaleString("fa-IR")} تومان`;
};

const getTrackingInfo = (shippingMethod) => {
  const method = String(shippingMethod || "")
    .trim()
    .toLowerCase();

  if (method.includes("تیپاکس") || method.includes("tipax")) {
    return {
      label: "رهگیری در سایت تیپاکس",
      url: "https://tipaxco.com/tracking",
    };
  }

  return {
    label: "رهگیری در سایت پست",
    url: "https://tracking.post.ir/",
  };
};

const Info = ({ label, children }) => (
  <div className="min-w-0">
    <p className="text-sm text-zinc-400">{label}</p>
    <div className="mt-1 break-words">{children || "ثبت نشده"}</div>
  </div>
);

function TrackingCode({ trackingCode, shippingMethod }) {
  const [copied, setCopied] = useState(false);
  const tracking = getTrackingInfo(shippingMethod);

  const copyTrackingCode = async () => {
    try {
      await navigator.clipboard.writeText(String(trackingCode));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      window.prompt("کد رهگیری را کپی کنید:", String(trackingCode));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span dir="ltr" className="font-mono font-bold">
        {trackingCode}
      </span>

      <button
        type="button"
        onClick={copyTrackingCode}
        className="rounded-lg border border-zinc-600 px-3 py-2 text-xs transition hover:bg-zinc-800"
      >
        {copied ? "کپی شد ✓" : "کپی کد"}
      </button>

      <a
        href={tracking.url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-cyan-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700"
      >
        {tracking.label}
      </a>
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getCustomerOrders();
      setOrders(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || "دریافت سفارش‌ها ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadOrders);
  }, [loadOrders, retry]);

  return (
    <section className="mx-auto min-h-[60vh] max-w-5xl px-4 py-8 text-white">
      <div className="mb-5">
        <BackPage fallback="/account" />
      </div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">سفارش‌های من</h1>
          <p className="mt-2 text-sm text-zinc-400">
            وضعیت سفارش‌ها و اطلاعات ارسال را بررسی کنید.
          </p>
        </div>

        <Link
          to="/account"
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm transition hover:bg-zinc-800"
        >
          بازگشت به حساب کاربری
        </Link>
      </div>

      {loading && (
        <p className="py-10 text-center text-zinc-300">
          در حال دریافت سفارش‌ها...
        </p>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 p-4">
          <p className="text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="mt-3 rounded-lg bg-red-800 px-4 py-2 transition hover:bg-red-700"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-8 text-center">
          <p className="text-lg">هنوز سفارشی ثبت نکرده‌اید.</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-lg bg-cyan-700 px-5 py-2 transition hover:bg-cyan-600"
          >
            مشاهده محصولات
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-5">
          {orders.map((order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            const payment = order.payment;
            const statusLabel = STATUS_LABELS[order.status] || "وضعیت نامشخص";

            return (
              <article
                key={order.id}
                className="rounded-xl border border-zinc-700 bg-zinc-900 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-700 pb-4">
                  <div>
                    <h2 className="font-bold">
                      سفارش شماره {String(order.id).toLocaleString("fa-IR")}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      تاریخ ثبت: {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      STATUS_STYLES[order.status] || "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-5 py-5 sm:grid-cols-2">
                  <Info label="مبلغ سفارش">
                    <span className="font-bold">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </Info>

                  <Info label="وضعیت پرداخت">
                    {PAYMENT_LABELS[payment?.status] ||
                      payment?.status ||
                      "اطلاعات موجود نیست"}
                  </Info>

                  <Info label="روش ارسال">{order.shippingMethod}</Info>

                  <Info label="کد رهگیری مرسوله">
                    {order.trackingCode ? (
                      <TrackingCode
                        trackingCode={order.trackingCode}
                        shippingMethod={order.shippingMethod}
                      />
                    ) : (
                      <span className="text-sm text-zinc-500">
                        پس از ارسال سفارش ثبت می‌شود.
                      </span>
                    )}
                  </Info>

                  <Info label="تاریخ ارسال">{formatDate(order.shippedAt)}</Info>
                </div>

                {(order.shippingRecipientName ||
                  order.shippingProvince ||
                  order.shippingCity ||
                  order.shippingAddressLine) && (
                  <div className="border-t border-zinc-700 py-4">
                    <h3 className="mb-3 font-semibold">اطلاعات گیرنده</h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Info label="نام گیرنده">
                        {order.shippingRecipientName}
                      </Info>

                      <Info label="استان و شهر">
                        {[order.shippingProvince, order.shippingCity]
                          .filter(Boolean)
                          .join("، ")}
                      </Info>

                      <div className="sm:col-span-2">
                        <Info label="آدرس ارسال">
                          {order.shippingAddressLine}
                        </Info>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-zinc-700 pt-4">
                  <h3 className="mb-3 font-semibold">محصولات سفارش</h3>

                  {items.length === 0 ? (
                    <p className="text-sm text-zinc-400">
                      اطلاعات محصولات این سفارش موجود نیست.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap justify-between gap-3 text-sm"
                        >
                          <div>
                            <p>{item.title}</p>
                            <p className="mt-1 text-zinc-400">
                              کد: {item.productCode || "ثبت نشده"}
                              {item.color ? ` | رنگ: ${item.color}` : ""}
                              {" | تعداد: "}
                              {Number(item.quantity || 0).toLocaleString(
                                "fa-IR",
                              )}
                            </p>
                          </div>

                          <p className="whitespace-nowrap">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
