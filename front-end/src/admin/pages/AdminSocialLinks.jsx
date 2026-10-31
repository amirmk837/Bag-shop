import { useEffect, useState } from "react";
import {
  FiInstagram,
  FiMessageCircle,
  FiSave,
  FiSend,
  FiRefreshCw,
} from "react-icons/fi";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const PLATFORMS = [
  {
    platform: "INSTAGRAM",
    label: "اینستاگرام",
    placeholder: "https://instagram.com/your-page",
    Icon: FiInstagram,
  },
  {
    platform: "TELEGRAM",
    label: "تلگرام",
    placeholder: "https://t.me/your-channel",
    Icon: FiSend,
  },
  {
    platform: "WHATSAPP",
    label: "واتساپ",
    placeholder: "https://wa.me/989123456789",
    Icon: FiMessageCircle,
  },
  {
    platform: "BALE",
    label: "بله",
    placeholder: "لینک صفحه یا کانال بله",
    Icon: FiMessageCircle,
  },
  {
    platform: "RUBIKA",
    label: "روبیکا",
    placeholder: "لینک صفحه یا کانال روبیکا",
    Icon: FiMessageCircle,
  },
];

const AdminSocialLinks = () => {
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingPlatform, setSavingPlatform] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadLinks = async (signal) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/social-links/admin`, {
        credentials: "include",
        signal,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "دریافت تنظیمات شبکه‌های اجتماعی ناموفق بود.",
        );
      }

      const nextDrafts = {};

      for (const item of result.data || []) {
        nextDrafts[item.platform] = item.url || "";
      }

      setDrafts(
        Object.fromEntries(
          PLATFORMS.map(({ platform }) => [
            platform,
            nextDrafts[platform] || "",
          ]),
        ),
      );
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message || "دریافت تنظیمات ناموفق بود.");
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    loadLinks(controller.signal);

    return () => controller.abort();
  }, []);

  const handleChange = (platform, value) => {
    setDrafts((current) => ({
      ...current,
      [platform]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSave = async (platform) => {
    if (savingPlatform !== null) return;

    try {
      setSavingPlatform(platform);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_BASE_URL}/social-links/admin/${platform}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: drafts[platform] || "",
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "ذخیره لینک ناموفق بود.");
      }

      setDrafts((current) => ({
        ...current,
        [platform]: result.data?.url || "",
      }));

      const label = PLATFORMS.find((item) => item.platform === platform)?.label;

      setSuccess(
        drafts[platform]?.trim()
          ? `لینک ${label} ذخیره شد.`
          : `لینک ${label} حذف شد و در فوتر نمایش داده نمی‌شود.`,
      );
    } catch (requestError) {
      setError(requestError.message || "ذخیره لینک ناموفق بود.");
    } finally {
      setSavingPlatform(null);
    }
  };

  return (
    <div dir="rtl" className="space-y-7 text-white">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black">مدیریت شبکه‌های اجتماعی</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            لینک شبکه‌های اجتماعی فروشگاه را تنظیم کن. فقط لینک‌های ذخیره‌شده در
            فوتر نمایش داده می‌شوند.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadLinks()}
          disabled={loading || savingPlatform !== null}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm transition hover:bg-zinc-800 disabled:opacity-50"
        >
          <FiRefreshCw />
          تازه‌سازی
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm leading-6 text-red-400"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm leading-6 text-emerald-400"
        >
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7">
        <div className="mb-6">
          <h3 className="text-lg font-bold">لینک‌های فروشگاه</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            برای مخفی‌کردن یک شبکه از فوتر، لینک آن را پاک کن و ذخیره بزن.
          </p>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-zinc-400">
            در حال دریافت تنظیمات...
          </p>
        ) : (
          <div className="space-y-5">
            {PLATFORMS.map(({ platform, label, placeholder, Icon }) => (
              <div
                key={platform}
                className="grid gap-3 border-b border-zinc-800 pb-5 last:border-0 last:pb-0 sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-end"
              >
                <label
                  htmlFor={`social-${platform}`}
                  className="flex items-center gap-2 text-sm font-semibold text-zinc-200"
                >
                  <Icon size={18} />
                  {label}
                </label>

                <input
                  id={`social-${platform}`}
                  type="text"
                  dir="ltr"
                  value={drafts[platform] || ""}
                  onChange={(event) =>
                    handleChange(platform, event.target.value)
                  }
                  placeholder={placeholder}
                  maxLength={2048}
                  disabled={savingPlatform !== null}
                  className="min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-left text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-400 disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() => handleSave(platform)}
                  disabled={savingPlatform !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiSave />
                  {savingPlatform === platform ? "در حال ذخیره..." : "ذخیره"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminSocialLinks;
