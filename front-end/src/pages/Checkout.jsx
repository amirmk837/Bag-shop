import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiMapPin,
  FiSave,
  FiTruck,
  FiCreditCard,
  FiPackage,
  FiEdit2,
  FiChevronLeft,
} from "react-icons/fi";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  getAddress,
  saveAddress,
} from "../../../back-end/src/services/addressApi";
import { startPayment } from "../../../back-end/src/services/paymentApi";
import BackPage from "../components/BackPage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PAYMENT_FLOW_READY = import.meta.env.VITE_PAYMENT_FLOW_READY === "true";

const initialAddress = {
  recipientName: "",
  recipientPhone: "",
  province: "",
  city: "",
  addressLine: "",
  postalCode: "",
  plateNumber: "",
  unitNumber: "",
};

const ADDRESS_FIELDS = Object.keys(initialAddress);

const normalizeDigits = (value = "") =>
  String(value)
    .replace(/[۰-۹]/g, (digit) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(digit)])
    .replace(/[٠-٩]/g, (digit) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(digit)]);

const normalizeAddress = (value) => {
  if (!value || typeof value !== "object") return null;

  const result = { ...initialAddress };

  for (const field of ADDRESS_FIELDS) {
    result[field] =
      value[field] === null || value[field] === undefined
        ? ""
        : String(value[field]);
  }

  if (
    !result.recipientName.trim() ||
    !result.recipientPhone.trim() ||
    !result.province.trim() ||
    !result.city.trim() ||
    !result.addressLine.trim() ||
    !result.postalCode.trim()
  ) {
    return null;
  }

  return result;
};

const formatPrice = (value) =>
  `${Math.max(0, Number(value) || 0).toLocaleString("fa-IR")} تومان`;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function Checkout() {
  const location = useLocation();
  const auth = useAuth();
  const cartContext = useCart();

  const user = auth?.user;
  const authLoading = Boolean(auth?.loading);

  const cartItems =
    cartContext?.items ??
    cartContext?.cartItems ??
    cartContext?.cart?.items ??
    [];

  const subtotal = Number(
    cartContext?.subtotal ??
      cartItems.reduce(
        (total, item) =>
          total +
          Number(item.price ?? item.product?.price ?? 0) *
            Number(item.quantity ?? 1),
        0,
      ),
  );

  const cartLoading = Boolean(cartContext?.loading);

  const [address, setAddress] = useState(null);
  const [form, setForm] = useState({ ...initialAddress });
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressEditorOpen, setAddressEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [shippingMethods, setShippingMethods] = useState([]);
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [shippingLoading, setShippingLoading] = useState(true);

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasAddress = Boolean(address);

  const hasUnsavedAddressChanges =
    hasAddress &&
    ADDRESS_FIELDS.some(
      (field) => String(form[field] ?? "") !== String(address[field] ?? ""),
    );

  const selectedShippingMethod = shippingMethods.find(
    (method) => String(method.id) === String(shippingMethodId),
  );

  const shippingCost = selectedShippingMethod
    ? Number(selectedShippingMethod.price)
    : 0;

  const productSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;

  const finalTotal = productSubtotal + shippingCost;

  const canPlaceOrder =
    PAYMENT_FLOW_READY &&
    hasAddress &&
    !hasUnsavedAddressChanges &&
    Boolean(selectedShippingMethod) &&
    !shippingLoading &&
    !placingOrder &&
    !cartLoading &&
    cartItems.length > 0;

  const loadAddress = useCallback(async () => {
    setAddressLoading(true);

    try {
      const result = await getAddress();
      const payload = result?.data ?? result;
      const rawAddress = payload?.address ?? payload?.data?.address ?? payload;

      const normalizedAddress = normalizeAddress(rawAddress);

      if (normalizedAddress) {
        setAddress(normalizedAddress);
        setForm(normalizedAddress);
        setAddressEditorOpen(false);
      } else {
        setAddress(null);
        setForm({ ...initialAddress });
        setAddressEditorOpen(true);
      }
    } catch (err) {
      setAddress(null);
      setForm({ ...initialAddress });
      setAddressEditorOpen(true);
      setError(getErrorMessage(err, "دریافت آدرس با خطا مواجه شد."));
    } finally {
      setAddressLoading(false);
    }
  }, []);

  const loadShippingMethods = useCallback(async () => {
    setShippingLoading(true);

    try {
      const response = await fetch(`${API_URL}/shipping-methods/active`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "دریافت روش‌های ارسال ناموفق بود.");
      }

      const payload = data?.data ?? data;

      // پاسخ API می‌تواند آرایه یا شیء دارای items باشد.
      const methods = Array.isArray(payload)
        ? payload
        : (payload?.items ?? payload?.shippingMethods ?? payload?.methods);

      if (!Array.isArray(methods)) {
        throw new Error("ساختار پاسخ روش‌های ارسال معتبر نیست.");
      }

      const validMethods = methods.filter((method) => {
        const id = Number(method.id);
        const price = Number(method.price);

        return (
          Number.isSafeInteger(id) &&
          id > 0 &&
          Number.isSafeInteger(price) &&
          price >= 0 &&
          method.isActive !== false
        );
      });

      setShippingMethods(validMethods);

      setShippingMethodId((currentId) => {
        const currentExists = validMethods.some(
          (method) => String(method.id) === String(currentId),
        );

        return currentExists
          ? currentId
          : validMethods.length
            ? String(validMethods[0].id)
            : "";
      });
    } catch (err) {
      setShippingMethods([]);
      setShippingMethodId("");
      setError(getErrorMessage(err, "دریافت روش‌های ارسال با خطا مواجه شد."));
    } finally {
      setShippingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAddressLoading(false);
      setShippingLoading(false);
      return;
    }

    loadAddress();
    loadShippingMethods();
  }, [authLoading, user, loadAddress, loadShippingMethods]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSaveAddress = async (event) => {
    event.preventDefault();

    if (saving) return;

    const normalizedForm = Object.fromEntries(
      ADDRESS_FIELDS.map((field) => [
        field,
        normalizeDigits(form[field] ?? "").trim(),
      ]),
    );

    const requiredFields = [
      ["recipientName", "نام تحویل‌گیرنده"],
      ["recipientPhone", "شماره موبایل"],
      ["province", "استان"],
      ["city", "شهر"],
      ["addressLine", "نشانی کامل"],
      ["postalCode", "کد پستی"],
    ];

    const missingField = requiredFields.find(
      ([field]) => !normalizedForm[field],
    );

    if (missingField) {
      setError(`وارد کردن ${missingField[1]} الزامی است.`);
      return;
    }

    if (!/^09\d{9}$/.test(normalizedForm.recipientPhone)) {
      setError("شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد.");
      return;
    }

    if (!/^\d{10}$/.test(normalizedForm.postalCode)) {
      setError("کد پستی باید دقیقاً ۱۰ رقم باشد.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await saveAddress(normalizedForm);
      const payload = result?.data ?? result;

      const savedAddress = normalizeAddress(
        payload?.address ?? payload?.data?.address ?? payload,
      );

      // اگر API پاسخ کامل آدرس نداد، از فرم اعتبارسنجی‌شده استفاده کن.
      const finalAddress = savedAddress ?? normalizedForm;

      setAddress(finalAddress);
      setForm(finalAddress);
      setAddressEditorOpen(false);
      setSuccess("آدرس با موفقیت ذخیره شد.");
    } catch (err) {
      setError(getErrorMessage(err, "ذخیره آدرس با خطا مواجه شد."));
    } finally {
      setSaving(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (placingOrder) return;

    setError("");
    setSuccess("");

    if (!PAYMENT_FLOW_READY) {
      setError("پرداخت آنلاین هنوز در تنظیمات محیط فعال نشده است.");
      return;
    }

    if (!hasAddress) {
      setError("ابتدا آدرس تحویل را ثبت کنید.");
      setAddressEditorOpen(true);
      return;
    }

    if (hasUnsavedAddressChanges) {
      setError("تغییرات آدرس را ابتدا ذخیره کنید.");
      setAddressEditorOpen(true);
      return;
    }

    if (!selectedShippingMethod) {
      setError("یک روش ارسال معتبر انتخاب کنید.");
      return;
    }

    if (cartLoading || cartItems.length === 0) {
      setError("سبد خرید خالی است یا هنوز بارگذاری نشده است.");
      return;
    }

    setPlacingOrder(true);

    try {
      const result = await startPayment({
        shippingMethodId: selectedShippingMethod.id,
      });

      const payload = result?.data ?? result;

      const paymentUrl =
        payload?.paymentUrl ??
        payload?.url ??
        payload?.data?.paymentUrl ??
        payload?.data?.url;

      if (typeof paymentUrl !== "string" || !paymentUrl.trim()) {
        throw new Error("لینک پرداخت معتبر از سرور دریافت نشد.");
      }

      let parsedUrl;

      try {
        parsedUrl = new URL(paymentUrl);
      } catch {
        throw new Error("آدرس درگاه پرداخت معتبر نیست.");
      }

      const isLocalhost = ["localhost", "127.0.0.1"].includes(
        parsedUrl.hostname,
      );

      if (
        parsedUrl.protocol !== "https:" &&
        !(isLocalhost && parsedUrl.protocol === "http:")
      ) {
        throw new Error("لینک پرداخت باید از اتصال امن HTTPS باشد.");
      }

      window.location.assign(parsedUrl.href);
    } catch (err) {
      setError(getErrorMessage(err, "شروع فرایند پرداخت با خطا مواجه شد."));
      setPlacingOrder(false);
    }
  };

  if (authLoading) {
    return <PageMessage message="در حال بررسی حساب کاربری..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (cartLoading) {
    return <PageMessage message="در حال بارگذاری سبد خرید..." />;
  }

  if (!cartItems.length) {
    return (
      <main
        dir="rtl"
        className="min-h-[60vh] bg-cyan-950 px-4 py-12 text-white"
      >
        <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center sm:p-12">
          <FiPackage className="mx-auto mb-4 text-zinc-400" size={42} />
          <h1 className="text-xl font-bold">سبد خرید خالی است</h1>
          <p className="mt-3 text-sm text-zinc-400">
            برای ادامه خرید، ابتدا محصولی به سبد خرید اضافه کنید.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            بازگشت به فروشگاه
            <FiArrowRight />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen px-4 py-8 text-white sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5"><BackPage fallback="/cart" /></div>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <FiArrowRight />
              بازگشت به فروشگاه
            </Link>
            <h1 className="text-2xl font-extrabold sm:text-3xl">تکمیل سفارش</h1>
            <p className="mt-2 text-sm text-zinc-400">
              آدرس تحویل، روش ارسال و مبلغ سفارش را بررسی کنید.
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-4">
          <Step number="۱" title="سبد خرید" completed />
          <Step number="۲" title="ارسال و آدرس" active />
          <Step number="۳" title="پرداخت" />
        </div>

        {(error || success) && (
          <div
            role="status"
            className={`mb-6 rounded-2xl border p-4 text-sm leading-7 ${
              error
                ? "border-red-900/70 bg-red-950/40 text-red-300"
                : "border-green-900/70 bg-green-950/30 text-green-300"
            }`}
          >
            {error || success}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {/* آدرس تحویل */}
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7">
              <SectionHeading
                icon={<FiMapPin size={21} />}
                title="آدرس تحویل سفارش"
                description="محل تحویل و مشخصات گیرنده را تعیین کنید."
              />

              {addressLoading ? (
                <LoadingLine text="در حال دریافت آدرس ذخیره‌شده..." />
              ) : (
                <>
                  {hasAddress && (
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <FiCheckCircle
                          className="mt-1 shrink-0 text-green-400"
                          size={19}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white">
                            {address.recipientName}
                          </p>
                          <p className="mt-1 text-sm text-zinc-400">
                            {address.recipientPhone}
                          </p>
                          <p className="mt-1 text-sm text-zinc-400">
                            {address.province}، {address.city}
                          </p>

                          {!addressEditorOpen && (
                            <>
                              <p className="mt-2 break-words text-sm leading-7 text-zinc-400">
                                {address.addressLine}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                کد پستی: {address.postalCode}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAddressEditorOpen((open) => !open);
                          setError("");
                          setSuccess("");
                          if (addressEditorOpen && address) {
                            setForm(address);
                          }
                        }}
                        aria-expanded={addressEditorOpen}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 cursor-pointer"
                      >
                        <FiEdit2 size={15} />
                        {addressEditorOpen ? "بستن ویرایش" : "تغییر آدرس"}
                      </button>
                    </div>
                  )}

                  {!hasAddress && (
                    <p className="mb-5 rounded-xl border border-amber-900/60 bg-amber-950/20 p-3 text-sm leading-7 text-amber-200">
                      هنوز آدرسی ثبت نکرده‌اید. فرم زیر را تکمیل کنید.
                    </p>
                  )}

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                      addressEditorOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                    aria-hidden={!addressEditorOpen}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <form
                        onSubmit={handleSaveAddress}
                        className="grid grid-cols-1 gap-4 pb-1 sm:grid-cols-2"
                        inert={!addressEditorOpen}
                      >
                        <Field
                          label="نام تحویل‌گیرنده"
                          name="recipientName"
                          value={form.recipientName}
                          onChange={handleFormChange}
                          placeholder="نام و نام خانوادگی"
                          required
                        />

                        <Field
                          label="شماره موبایل"
                          name="recipientPhone"
                          value={form.recipientPhone}
                          onChange={handleFormChange}
                          placeholder="09123456789"
                          inputMode="numeric"
                          required
                        />

                        <Field
                          label="استان"
                          name="province"
                          value={form.province}
                          onChange={handleFormChange}
                          placeholder="مثلاً تهران"
                          required
                        />

                        <Field
                          label="شهر"
                          name="city"
                          value={form.city}
                          onChange={handleFormChange}
                          placeholder="نام شهر"
                          required
                        />

                        <Field
                          label="کد پستی"
                          name="postalCode"
                          value={form.postalCode}
                          onChange={handleFormChange}
                          placeholder="۱۰ رقم بدون خط تیره"
                          inputMode="numeric"
                          required
                        />

                        <Field
                          label="پلاک"
                          name="plateNumber"
                          value={form.plateNumber}
                          onChange={handleFormChange}
                          placeholder="شماره پلاک"
                        />

                        <Field
                          label="واحد"
                          name="unitNumber"
                          value={form.unitNumber}
                          onChange={handleFormChange}
                          placeholder="شماره واحد"
                        />

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="addressLine"
                            className="mb-2 block text-sm font-medium text-zinc-300"
                          >
                            نشانی کامل
                          </label>
                          <textarea
                            id="addressLine"
                            name="addressLine"
                            value={form.addressLine}
                            onChange={handleFormChange}
                            required
                            rows={3}
                            placeholder="خیابان، کوچه، خیابان فرعی و سایر جزئیات..."
                            className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-900/40"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto cursor-pointer"
                          >
                            <FiSave size={17} />
                            {saving ? "در حال ذخیره..." : "ذخیره آدرس"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {hasAddress && !addressEditorOpen && (
                    <p className="mt-3 text-xs leading-6 text-zinc-500">
                      برای ویرایش اطلاعات تحویل، گزینه تغییر آدرس را بزنید.
                    </p>
                  )}
                </>
              )}
            </section>

            {/* روش ارسال */}
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7">
              <SectionHeading
                icon={<FiTruck size={21} />}
                title="روش ارسال"
                description="روش مناسب ارسال سفارش خود را انتخاب کنید."
              />

              {shippingLoading ? (
                <LoadingLine text="در حال دریافت روش‌های ارسال..." />
              ) : shippingMethods.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5 text-sm leading-7 text-zinc-400">
                  در حال حاضر روش ارسال فعالی دریافت نشد. اتصال API و فعال بودن
                  روش‌های ارسال در پنل مدیریت را بررسی کنید.
                  <button
                    type="button"
                    onClick={loadShippingMethods}
                    className="mt-3 block font-semibold text-white underline underline-offset-4"
                  >
                    تلاش مجدد
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingMethods.map((method) => {
                    const selected =
                      String(method.id) === String(shippingMethodId);

                    return (
                      <label
                        key={method.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                          selected
                            ? "border-cyan-600 bg-cyan-950/40"
                            : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={String(method.id)}
                          checked={selected}
                          onChange={() =>
                            setShippingMethodId(String(method.id))
                          }
                          className="h-4 w-4 accent-cyan-500"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white">
                            {method.name}
                          </p>
                          {method.description && (
                            <p className="mt-1 text-xs leading-6 text-zinc-400">
                              {method.description}
                            </p>
                          )}
                        </div>

                        <span className="shrink-0 text-sm font-bold text-white">
                          {formatPrice(method.price)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {/* اقلام سفارش */}
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-7">
              <SectionHeading
                icon={<FiPackage size={21} />}
                title="اقلام سفارش"
                description={`${cartItems.length.toLocaleString("fa-IR")} نوع محصول در سبد خرید`}
              />

              <div className="divide-y divide-zinc-800">
                {cartItems.map((item, index) => {
                  const product = item.product ?? item;
                  const title =
                    product.name ??
                    product.title ??
                    product.productName ??
                    "محصول";

                  const price = Number(item.price ?? product.price ?? 0);

                  const quantity = Number(item.quantity ?? 1);

                  const image =
                    item.image ??
                    product.image ??
                    (Array.isArray(product.images)
                      ? product.images[0]
                      : product.images);

                  const productId =
                    item.productCode ??
                    product.productCode ??
                    product.code ??
                    product.id;

                  return (
                    <div
                      key={item.id ?? productId ?? index}
                      className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                        {image ? (
                          <img
                            src={image}
                            alt={title}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-zinc-600">
                            <FiPackage size={22} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-6 text-white">
                          {title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          تعداد: {quantity.toLocaleString("fa-IR")}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-white">
                        {formatPrice(price * quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <Link
                to="/cart"
                className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
              >
                ویرایش سبد خرید
                <FiChevronLeft />
              </Link>
            </section>
          </div>

          {/* خلاصه پرداخت */}
          <aside className="lg:sticky lg:top-6">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
              <SectionHeading
                icon={<FiCreditCard size={21} />}
                title="خلاصه سفارش"
              />

              <div className="space-y-4">
                <SummaryRow
                  label="مجموع محصولات"
                  value={formatPrice(productSubtotal)}
                />

                <SummaryRow
                  label="هزینه ارسال"
                  value={
                    shippingLoading
                      ? "در حال محاسبه..."
                      : selectedShippingMethod
                        ? formatPrice(shippingCost)
                        : "انتخاب نشده"
                  }
                />

                <div className="border-t border-zinc-800 pt-4">
                  <SummaryRow
                    label="مبلغ قابل پرداخت"
                    value={formatPrice(finalTotal)}
                    strong
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-bold text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 cursor-pointer"
              >
                {placingOrder ? (
                  "در حال انتقال به درگاه..."
                ) : (
                  <>
                    ادامه و پرداخت
                    <FiChevronLeft />
                  </>
                )}
              </button>

              {!PAYMENT_FLOW_READY && (
                <p className="mt-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-xs leading-6 text-amber-200">
                  درگاه پرداخت هنوز برای استفاده واقعی فعال نشده است.
                </p>
              )}

              {hasUnsavedAddressChanges && (
                <p className="mt-3 text-xs leading-6 text-amber-300">
                  ابتدا تغییرات آدرس را ذخیره کنید.
                </p>
              )}

              <p className="mt-4 text-center text-xs leading-6 text-zinc-500">
                اطلاعات سفارش پیش از پرداخت باید توسط سرور اعتبارسنجی شود.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Step({ number, title, active = false, completed = false }) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-2xl border p-3 sm:gap-3 sm:p-4 ${
        active
          ? "border-cyan-700 bg-cyan-900/40"
          : completed
            ? "border-zinc-700 bg-zinc-900"
            : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          active || completed
            ? "bg-white text-zinc-900"
            : "bg-zinc-800 text-zinc-400"
        }`}
      >
        {completed ? <FiCheckCircle size={17} /> : number}
      </span>
      <span
        className={`truncate text-xs font-semibold sm:text-sm ${
          active || completed ? "text-white" : "text-zinc-500"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

function SectionHeading({ icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-zinc-300">{icon}</span>
      <div>
        <h2 className="font-bold text-white sm:text-lg">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-6 text-zinc-400 sm:text-sm">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  inputMode,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        autoComplete="off"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-900/40"
      />
    </div>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span
        className={`text-sm ${
          strong ? "font-bold text-white" : "text-zinc-400"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-left ${
          strong
            ? "text-base font-extrabold text-white"
            : "text-sm font-medium text-zinc-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function LoadingLine({ text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
      {text}
    </div>
  );
}

function PageMessage({ message }) {
  return (
    <main
      dir="rtl"
      className="flex min-h-[60vh] items-center justify-center bg-cyan-950 px-4 text-white"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-5 text-sm text-zinc-300">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
        {message}
      </div>
    </main>
  );
}
