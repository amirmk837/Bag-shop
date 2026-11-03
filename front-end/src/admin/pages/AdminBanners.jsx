import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiImage,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";

import FeedbackDialog from "../components/ui/FeedbackDialog";

import {
  activateBanner,
  createBanner,
  deleteBanner,
  getAdminBanners,
  updateBanner,
} from "../../services/bannerApi";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const formatDate = (value) => {
  if (!value) return "ثبت نشده";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "ثبت نشده";
  }

  return date.toLocaleString("fa-IR");
};

const createDrafts = (banners) =>
  Object.fromEntries(
    banners.map((banner) => [
      banner.id,
      {
        name: banner.name || "",
        linkUrl: banner.linkUrl || "",
        fit: banner.fit === "cover" ? "cover" : "contain",
      },
    ]),
  );

const getImageUrl = (banner, type) => {
  if (type === "mobile") {
    return (
      banner.mobileImageUrl || banner.desktopImageUrl || banner.imageUrl || ""
    );
  }

  return banner.desktopImageUrl || banner.imageUrl || "";
};

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [editDrafts, setEditDrafts] = useState({});

  const [desktopFile, setDesktopFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);

  const [desktopPreviewUrl, setDesktopPreviewUrl] = useState("");
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState("");

  const [name, setName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [fit, setFit] = useState("contain");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBannerId, setSavingBannerId] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState("");

  // دریافت بنرها
  useEffect(() => {
    let ignore = false;

    const loadBanners = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminBanners();

        if (ignore) return;

        setBanners(data);
        setEditDrafts(createDrafts(data));
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || "دریافت بنرها ناموفق بود.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadBanners();

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  // آزادسازی URL تصاویر پیش‌نمایش
  useEffect(() => {
    return () => {
      if (desktopPreviewUrl) {
        URL.revokeObjectURL(desktopPreviewUrl);
      }

      if (mobilePreviewUrl) {
        URL.revokeObjectURL(mobilePreviewUrl);
      }
    };
  }, [desktopPreviewUrl, mobilePreviewUrl]);

  // انتخاب تصویر
  const handleImageChange = (event, type) => {
    const selectedFile = event.target.files?.[0];

    event.target.value = "";

    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("فرمت تصویر باید JPG، PNG، WEBP یا AVIF باشد.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("حجم هر تصویر نباید از ۱۰ مگابایت بیشتر باشد.");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);

    if (type === "desktop") {
      setDesktopFile(selectedFile);
      setDesktopPreviewUrl(previewUrl);

      // نام اولیه بنر از فایل دسکتاپ گرفته می‌شود.
      setName(selectedFile.name.replace(/\.[^.]+$/, ""));
    } else {
      setMobileFile(selectedFile);
      setMobilePreviewUrl(previewUrl);
    }

    setError("");
    setSuccess("");
  };

  // افزودن بنر
  const handleCreate = async (event) => {
    event.preventDefault();

    if (!desktopFile || !mobileFile) {
      setError("تصویر دسکتاپ و موبایل را هر دو انتخاب کن.");
      return;
    }

    if (!name.trim()) {
      setError("نام نمایشی بنر را وارد کن.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createBanner({
        desktopFile,
        mobileFile,
        name: name.trim(),
        linkUrl: linkUrl.trim(),
        fit,
        isActive,
      });

      setDesktopFile(null);
      setMobileFile(null);

      setDesktopPreviewUrl("");
      setMobilePreviewUrl("");

      setName("");
      setLinkUrl("");
      setFit("contain");
      setIsActive(true);

      setSuccess(
        isActive
          ? "بنر ذخیره شد و برای صفحه اصلی فعال شد."
          : "بنر با موفقیت ذخیره شد.",
      );

      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || "ذخیره بنر ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  // تغییر تنظیمات فرم ویرایش
  const handleDraftChange = (bannerId, field, value) => {
    setEditDrafts((current) => ({
      ...current,
      [bannerId]: {
        ...current[bannerId],
        [field]: value,
      },
    }));

    setError("");
    setSuccess("");
  };

  // ذخیره تنظیمات بنر موجود
  const handleSaveSettings = async (banner) => {
    const draft = editDrafts[banner.id];

    if (!draft || savingBannerId !== null) return;

    if (!draft.name.trim()) {
      setError("نام بنر نمی‌تواند خالی باشد.");
      return;
    }

    try {
      setSavingBannerId(banner.id);
      setError("");
      setSuccess("");

      await updateBanner(banner.id, {
        name: draft.name.trim(),
        linkUrl: draft.linkUrl.trim(),
        fit: draft.fit,
      });

      setSuccess(`تنظیمات بنر «${draft.name}» ذخیره شد.`);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || "ذخیره تنظیمات بنر ناموفق بود.");
    } finally {
      setSavingBannerId(null);
    }
  };

  // فعال یا غیرفعال کردن بنر
  const handleToggleActive = async (banner) => {
    if (
      !banner ||
      activatingId !== null ||
      savingBannerId !== null ||
      deletingId !== null
    ) {
      return;
    }

    try {
      setActivatingId(banner.id);
      setError("");
      setSuccess("");

      if (banner.isActive) {
        await updateBanner(banner.id, {
          isActive: false,
        });

        setSuccess(`بنر «${banner.name}» غیرفعال شد.`);
      } else {
        await activateBanner(banner.id);

        setSuccess(`بنر «${banner.name}» فعال شد.`);
      }

      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message || "تغییر وضعیت بنر ناموفق بود.");
    } finally {
      setActivatingId(null);
    }
  };

  // درخواست حذف
  const handleDeleteRequest = (banner) => {
    setError("");
    setSuccess("");
    setBannerToDelete(banner);

    setDeleteMessage(
      banner.isActive
        ? `بنر «${banner.name}» حذف شود؟\n\nاین عملیات قابل بازگشت نیست.`
        : `بنر «${banner.name}» برای همیشه حذف شود؟\n\nاین عملیات قابل بازگشت نیست.`,
    );
  };

  // تأیید حذف
  const handleDeleteConfirm = async () => {
    const banner = bannerToDelete;

    if (!banner || deletingId !== null) {
      return false;
    }

    try {
      setDeletingId(banner.id);
      setError("");
      setSuccess("");

      const result = await deleteBanner(banner.id);

      setSuccess(result.message || `بنر «${banner.name}» حذف شد.`);
      setBannerToDelete(null);
      setDeleteMessage("");

      setRefreshKey((current) => current + 1);

      return true;
    } catch (requestError) {
      const message = requestError.message || "حذف بنر ناموفق بود.";

      setError(message);
      setDeleteMessage(`${message}\n\nبرای تلاش مجدد، دکمه تأیید را بزن.`);

      return false;
    } finally {
      setDeletingId(null);
    }
  };

  // بستن پنجره حذف
  const closeDeleteDialog = () => {
    if (deletingId !== null) return;

    setBannerToDelete(null);
    setDeleteMessage("");
  };

  return (
    <div dir="rtl" className="space-y-4 text-white">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black">مدیریت بنرها</h2>

          <p className="mt-1 text-xs leading-5 text-zinc-400">
            تصاویر جداگانه دسکتاپ و موبایل را بارگذاری و بنر صفحه اصلی را مدیریت
            کن.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm transition hover:bg-zinc-800 disabled:opacity-50"
        >
          <FiRefreshCw />
          تازه‌سازی
        </button>
      </div>

      {/* MESSAGES */}
      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm leading-6 text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm leading-6 text-emerald-400">
          {success}
        </div>
      )}

      {/* CREATE BANNER */}
      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5"
      >
        <h3 className="text-lg font-bold">افزودن بنر جدید</h3>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          برای نمایش مناسب در اندازه‌های مختلف صفحه، تصویر دسکتاپ و موبایل را
          جداگانه انتخاب کن.
        </p>

        {/* IMAGE UPLOADS */}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {/* DESKTOP */}
          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              تصویر دسکتاپ
            </label>

            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-3 text-center transition hover:border-zinc-500">
              <FiUpload size={26} className="text-zinc-300" />

              <span className="text-sm font-semibold text-zinc-200">
                {desktopFile ? "انتخاب تصویر دیگر" : "انتخاب تصویر دسکتاپ"}
              </span>

              <span className="max-w-full break-all text-xs text-zinc-500">
                {desktopFile?.name ||
                  "JPG، PNG، WEBP یا AVIF · حداکثر ۱۰ مگابایت"}
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event) => handleImageChange(event, "desktop")}
                disabled={saving}
                className="hidden"
              />
            </label>
          </div>

          {/* MOBILE */}
          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              تصویر موبایل
            </label>

            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-5 text-center transition hover:border-zinc-500">
              <FiUpload size={26} className="text-zinc-300" />

              <span className="text-sm font-semibold text-zinc-200">
                {mobileFile ? "انتخاب تصویر دیگر" : "انتخاب تصویر موبایل"}
              </span>

              <span className="max-w-full break-all text-xs text-zinc-500">
                {mobileFile?.name ||
                  "JPG، PNG، WEBP یا AVIF · حداکثر ۱۰ مگابایت"}
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event) => handleImageChange(event, "mobile")}
                disabled={saving}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* PREVIEWS */}
        {(desktopPreviewUrl || mobilePreviewUrl) && (
          <div className="mt-4 space-y-4">
            {desktopPreviewUrl && (
              <div>
                <h4 className="mb-2 text-sm font-bold">پیش‌نمایش دسکتاپ</h4>

                <div className="aspect-[4/1] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                  <img
                    src={desktopPreviewUrl}
                    alt="پیش‌نمایش بنر دسکتاپ"
                    className="h-full w-full"
                    style={{ objectFit: fit }}
                  />
                </div>
              </div>
            )}

            {mobilePreviewUrl && (
              <div>
                <h4 className="mb-2 text-sm font-bold">پیش‌نمایش موبایل</h4>

                <div className="mx-auto aspect-[9/16] max-w-xs overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                  <img
                    src={mobilePreviewUrl}
                    alt="پیش‌نمایش بنر موبایل"
                    className="h-full w-full"
                    style={{ objectFit: fit }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* BANNER DETAILS */}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              نام نمایشی بنر
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              placeholder="مثلاً بنر پاییزی فروشگاه"
              disabled={saving}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              لینک مقصد بنر (اختیاری)
            </label>

            <input
              type="text"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              maxLength={2048}
              placeholder="/category/forward یا example.com"
              disabled={saving}
              dir="ltr"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-left text-white outline-none focus:border-zinc-400"
            />

            <p className="mt-2 text-xs leading-5 text-zinc-500">
              برای مقصد داخلی مسیر را با / شروع کن. برای سایت خارجی نام دامنه هم
              کافی است.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              نحوه نمایش تصویر
            </label>

            <select
              value={fit}
              onChange={(event) => setFit(event.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-400"
            >
              <option value="contain">نمایش کامل تصویر — بدون برش</option>

              <option value="cover">پرکردن قاب — احتمال برش تصویر</option>
            </select>
          </div>
        </div>

        {/* ACTIVATE */}
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            disabled={saving}
            className="mt-1 accent-white"
          />

          <span>
            <span className="block text-sm font-semibold text-white">
              بعد از ذخیره، بنر فعال صفحه اصلی شود
            </span>

            <span className="mt-1 block text-xs leading-5 text-zinc-500">
              بنر فعال قبلی طبق منطق فعال‌سازی بک‌اند مدیریت می‌شود.
            </span>
          </span>
        </label>

        {/* SUBMIT */}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving || !desktopFile || !mobileFile || !name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiUpload />
            {saving ? "در حال ذخیره..." : "ذخیره بنر"}
          </button>
        </div>
      </form>

      {/* SAVED BANNERS */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7">
        <div className="mb-4">
          <h3 className="text-lg font-bold">بنرهای ذخیره‌شده</h3>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            تصویرهای دسکتاپ و موبایل، لینک مقصد و وضعیت هر بنر را بررسی و مدیریت
            کن.
          </p>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-zinc-400">
            در حال دریافت بنرها...
          </p>
        ) : banners.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center">
            <FiImage size={30} className="mx-auto text-zinc-500" />

            <p className="mt-4 font-semibold">هنوز بنری ذخیره نشده است.</p>

            <p className="mt-2 text-sm text-zinc-500">
              از فرم بالا اولین بنر را اضافه کن.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {banners.map((banner) => {
              const draft = editDrafts[banner.id] || {
                name: banner.name || "",
                linkUrl: banner.linkUrl || "",
                fit: banner.fit || "contain",
              };

              return (
                <article
                  key={banner.id}
                  className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950"
                >
                  {/* EXISTING IMAGE PREVIEWS */}
                  <div className="grid gap-3 p-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs text-zinc-400">دسکتاپ</p>

                      <div className="aspect-[4/1] overflow-hidden rounded-lg bg-black">
                        <img
                          src={getImageUrl(banner, "desktop")}
                          alt={`${banner.name} - دسکتاپ`}
                          className="h-full w-full"
                          style={{ objectFit: draft.fit }}
                          loading="lazy"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs text-zinc-400">موبایل</p>

                      <div className="mx-auto aspect-[9/16] max-w-[120px] overflow-hidden rounded-lg bg-black">
                        <img
                          src={getImageUrl(banner, "mobile")}
                          alt={`${banner.name} - موبایل`}
                          className="h-full w-full"
                          style={{ objectFit: draft.fit }}
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    {/* TITLE AND STATUS */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="font-bold text-white">{banner.name}</h4>

                      {banner.isActive ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-950/40 px-3 py-2 text-xs font-bold text-emerald-300">
                          <FiCheckCircle />
                          فعال در سایت
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-400">
                          غیرفعال
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500">
                      تاریخ ذخیره: {formatDate(banner.createdAt)}
                    </p>

                    {/* EDIT NAME */}
                    <div>
                      <label className="mb-2 block text-xs text-zinc-400">
                        نام نمایشی
                      </label>

                      <input
                        value={draft.name}
                        onChange={(event) =>
                          handleDraftChange(
                            banner.id,
                            "name",
                            event.target.value,
                          )
                        }
                        maxLength={120}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-400"
                      />
                    </div>

                    {/* EDIT LINK */}
                    <div>
                      <label className="mb-2 block text-xs text-zinc-400">
                        لینک مقصد
                      </label>

                      <input
                        value={draft.linkUrl}
                        onChange={(event) =>
                          handleDraftChange(
                            banner.id,
                            "linkUrl",
                            event.target.value,
                          )
                        }
                        maxLength={2048}
                        placeholder="/category/forward یا example.com"
                        dir="ltr"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-left text-sm text-white outline-none focus:border-zinc-400"
                      />

                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        برای بدون مقصد بودن، این فیلد را خالی بگذار.
                      </p>
                    </div>

                    {/* EDIT FIT */}
                    <div>
                      <label className="mb-2 block text-xs text-zinc-400">
                        نحوه نمایش تصویر
                      </label>

                      <select
                        value={draft.fit}
                        onChange={(event) =>
                          handleDraftChange(
                            banner.id,
                            "fit",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-400"
                      >
                        <option value="contain">
                          نمایش کامل تصویر — بدون برش
                        </option>

                        <option value="cover">
                          پرکردن قاب — احتمال برش تصویر
                        </option>
                      </select>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-wrap gap-3 border-t border-zinc-800 pt-4">
                      <button
                        type="button"
                        onClick={() => handleSaveSettings(banner)}
                        disabled={
                          savingBannerId !== null ||
                          activatingId !== null ||
                          deletingId !== null
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FiSave />

                        {savingBannerId === banner.id
                          ? "در حال ذخیره..."
                          : "ذخیره تنظیمات"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(banner)}
                        disabled={
                          activatingId !== null ||
                          savingBannerId !== null ||
                          deletingId !== null
                        }
                        className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {activatingId === banner.id
                          ? "در حال تغییر وضعیت..."
                          : banner.isActive
                            ? "غیرفعال‌کردن"
                            : "افزودن به اسلایدر"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(banner)}
                        disabled={
                          deletingId !== null ||
                          activatingId !== null ||
                          savingBannerId !== null
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-900/60 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FiTrash2 />
                        حذف بنر
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* DELETE CONFIRMATION */}
      <FeedbackDialog
        open={Boolean(bannerToDelete)}
        type="confirm"
        title={`حذف بنر ${bannerToDelete?.name || ""}`}
        message={deleteMessage}
        confirmText={deletingId !== null ? "در حال حذف..." : "حذف دائمی بنر"}
        cancelText="انصراف"
        onConfirm={handleDeleteConfirm}
        onClose={closeDeleteDialog}
      />
    </div>
  );
};

export default AdminBanners;
