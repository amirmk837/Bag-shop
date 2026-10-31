import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function InfoCard({ title, children }) {
  return (
    <section className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
      <h2 className="mb-4 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

export default function AdminPaymentSettings() {
  const [merchantId, setMerchantId] = useState("");
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const response = await fetch(`${API_URL}/admin/payment-settings`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "دریافت تنظیمات پرداخت ناموفق بود.");
        }

        if (!cancelled) {
          setMerchantId(data.merchantId ?? "");
          setConfigured(Boolean(data.configured));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "ارتباط با سرور برقرار نشد.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/admin/payment-settings`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchantId: merchantId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ذخیره تنظیمات ناموفق بود.");
      }

      setMerchantId(data.merchantId ?? "");
      setConfigured(Boolean(data.configured));
      setMessage(data.message || "تنظیمات ذخیره شد.");
    } catch (err) {
      setError(err.message || "ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" className="space-y-6 text-white">
      <header>
        <h1 className="text-2xl font-bold">تنظیمات پرداخت آنلاین</h1>

        <p className="mt-2 leading-7 text-zinc-400">
          شناسه پذیرنده زرین‌پال را از این بخش ثبت و مدیریت کن. پرداخت آنلاین تا
          تکمیل و آزمایش فرایند پرداخت در سمت سرور غیرفعال باقی می‌ماند.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm text-amber-300">وضعیت پرداخت</p>

          <p className="mt-2 text-xl font-bold">غیرفعال</p>

          <p className="mt-2 text-sm leading-6 text-zinc-300">
            ثبت شناسه پذیرنده به معنی فعال‌شدن پرداخت نیست.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">وضعیت تنظیمات زرین‌پال</p>

          <p className="mt-2 text-xl font-bold">
            {loading
              ? "در حال بررسی..."
              : configured
                ? "شناسه ثبت شده"
                : "شناسه ثبت نشده"}
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            این وضعیت پس از دریافت پاسخ سرور نمایش داده می‌شود.
          </p>
        </div>
      </section>

      <InfoCard title="تنظیمات زرین‌پال">
        {loading ? (
          <p className="text-zinc-400">در حال دریافت تنظیمات از سرور...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="merchantId"
                className="mb-2 block text-sm font-medium"
              >
                شناسه پذیرنده (Merchant ID)
              </label>

              <input
                id="merchantId"
                type="text"
                dir="ltr"
                value={merchantId}
                onChange={(event) => setMerchantId(event.target.value)}
                maxLength={36}
                autoComplete="off"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                title="شناسه پذیرنده باید در قالب UUID باشد."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-left text-white outline-none focus:border-cyan-500 sm:w-1/3"
              />
            </div>

            <p className="text-sm leading-7 text-zinc-400">
              این شناسه را از پنل رسمی زرین‌پال دریافت کن. برای ذخیره تنظیمات،
              فیلد را خالی بگذار تا شناسه قبلی پاک شود.
            </p>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                role="status"
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cyan-700 px-5 py-3 font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
            </button>
          </form>
        )}
      </InfoCard>

      <InfoCard title="نکات امنیتی">
        <ul className="list-inside list-disc space-y-3 text-sm leading-7 text-zinc-300">
          <li>این API باید فقط برای مدیر احراز هویت‌شده قابل دسترسی باشد.</li>
          <li>
            فعال‌شدن پرداخت باید فقط پس از پیاده‌سازی درخواست پرداخت، تأیید
            تراکنش از سمت سرور و بررسی نتیجه واقعی درگاه انجام شود.
          </li>
          <li>بازگشت کاربر به سایت به‌تنهایی اثبات پرداخت موفق نیست.</li>
          <li>
            قبل از فعال‌سازی، باید واحد مبلغ، شناسه سفارش، جلوگیری از تأیید
            تکراری و وضعیت سفارش پرداخت‌نشده نیز بررسی شوند.
          </li>
        </ul>
      </InfoCard>
    </main>
  );
}
