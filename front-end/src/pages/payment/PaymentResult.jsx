import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getPaymentStatus } from "../../services/paymentApi";

const formatPrice = (value) => Number(value || 0).toLocaleString("fa-IR");

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const orderId = Number(searchParams.get("orderId"));

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      setError("شماره سفارش در آدرس وجود ندارد یا معتبر نیست.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getPaymentStatus(orderId);
      setPayment(result);
    } catch (requestError) {
      setError(requestError.message || "دریافت وضعیت پرداخت ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void Promise.resolve().then(loadStatus);
  }, [loadStatus]);

  const isPaid =
    payment?.paymentStatus === "PAID" && payment?.orderStatus === "PAID";

  const isFailed =
    payment?.paymentStatus === "FAILED" ||
    payment?.paymentStatus === "CANCELLED" ||
    payment?.orderStatus === "CANCELLED";

  return (
    <main
      dir="rtl"
      className="mx-auto min-h-[60vh] max-w-3xl px-4 py-12 text-white"
    >
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-xl sm:p-10">
        {loading ? (
          <>
            <h1 className="text-xl font-bold">در حال بررسی پرداخت</h1>
            <p className="mt-3 text-zinc-400">
              لطفاً تا دریافت وضعیت معتبر از سرور صبر کنید.
            </p>
          </>
        ) : error ? (
          <>
            <h1 className="text-xl font-bold text-red-400">
              دریافت وضعیت پرداخت ناموفق بود
            </h1>
            <p className="mt-3 text-sm leading-7 text-zinc-400">{error}</p>
          </>
        ) : isPaid ? (
          <>
            <div className="text-5xl text-emerald-400">✓</div>
            <h1 className="mt-4 text-2xl font-black text-emerald-400">
              پرداخت با موفقیت تأیید شد
            </h1>
            <p className="mt-3 text-zinc-300">
              سفارش شما با موفقیت پرداخت شده است.
            </p>
          </>
        ) : isFailed ? (
          <>
            <h1 className="text-2xl font-black text-red-400">
              پرداخت تکمیل نشده است
            </h1>
            <p className="mt-3 leading-7 text-zinc-400">
              وضعیت سفارش لغو شده یا پرداخت ناموفق بوده است. وضعیت سفارش را
              بررسی کنید و در صورت نیاز با پشتیبانی تماس بگیرید.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-amber-400">
              پرداخت در حال بررسی است
            </h1>
            <p className="mt-3 leading-7 text-zinc-400">
              هنوز تأیید نهایی پرداخت از سرور دریافت نشده است. این صفحه را
              دوباره بررسی کنید؛ تا زمان تأیید، پرداخت موفق محسوب نمی‌شود.
            </p>
          </>
        )}

        {payment && (
          <div className="mx-auto mt-7 max-w-md space-y-3 rounded-2xl border border-zinc-800 p-4 text-right">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">شماره سفارش</span>
              <span className="font-bold">{payment.orderId}</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">مبلغ سفارش</span>
              <span className="font-bold">
                {formatPrice(payment.totalAmount)} تومان
              </span>
            </div>

            {payment.refId && (
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">شماره پیگیری</span>
                <span className="break-all font-bold">{payment.refId}</span>
              </div>
            )}

            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">وضعیت پرداخت</span>
              <span className="font-bold">
                {payment.paymentStatus === "PAID"
                  ? "پرداخت‌شده"
                  : payment.paymentStatus === "CANCELLED"
                    ? "لغوشده"
                    : payment.paymentStatus === "FAILED"
                      ? "ناموفق"
                      : "در انتظار تأیید"}
              </span>
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {!loading && !isPaid && !isFailed && (
            <button
              type="button"
              onClick={loadStatus}
              className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-50"
              disabled={loading}
            >
              بررسی دوباره وضعیت
            </button>
          )}

          {error && (
            <button
              type="button"
              onClick={loadStatus}
              className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-zinc-950"
            >
              تلاش مجدد
            </button>
          )}

          <Link
            to="/"
            className="rounded-xl border border-zinc-700 px-5 py-3 font-bold transition hover:bg-zinc-800"
          >
            بازگشت به فروشگاه
          </Link>
        </div>
      </section>
    </main>
  );
};

export default PaymentResult;
