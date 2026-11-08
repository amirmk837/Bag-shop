import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import { FiArrowRight, FiMapPin, FiSave, FiPackage } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAddress,
  saveAddress,
} from "../../services/addressApi";
import IranLocationPicker from "../../components/address/IranLocationPicker";
import BackPage from "../../components/BackPage";

const initialValues = {
  recipientName: "",
  recipientPhone: "",
  province: "",
  city: "",
  addressLine: "",
  postalCode: "",
  plateNumber: "",
  unitNumber: "",
};

const normalizeDigits = (value = "") =>
  value
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));

const validate = (values) => {
  const errors = {};

  const phone = normalizeDigits(values.recipientPhone);
  const postalCode = normalizeDigits(values.postalCode);

  if (!values.recipientName.trim()) {
    errors.recipientName = "نام گیرنده الزامی است.";
  } else if (values.recipientName.trim().length < 2) {
    errors.recipientName = "نام گیرنده باید حداقل ۲ کاراکتر باشد.";
  }

  if (!/^09\d{9}$/.test(phone)) {
    errors.recipientPhone = "شماره تماس معتبر نیست.";
  }

  if (!values.province) {
    errors.province = "استان را انتخاب کنید.";
  }

  if (!values.city) {
    errors.city = "شهر را انتخاب کنید.";
  }

  const addressLength = values.addressLine.trim().length;

  if (addressLength < 10) {
    errors.addressLine = "آدرس باید حداقل ۱۰ کاراکتر باشد.";
  } else if (addressLength > 500) {
    errors.addressLine = "آدرس نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد.";
  }

  if (!/^\d{10}$/.test(postalCode)) {
    errors.postalCode = "کد پستی باید دقیقاً ۱۰ رقم باشد.";
  }

  if (values.plateNumber.length > 20) {
    errors.plateNumber = "شماره پلاک بیش از حد طولانی است.";
  }

  if (values.unitNumber.length > 20) {
    errors.unitNumber = "شماره واحد بیش از حد طولانی است.";
  }

  return errors;
};

const Account = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  // فقط مسیر داخلی مشخص‌شده را برای بازگشت قبول می‌کنیم.
  const returnTo = location.state?.returnTo === "/checkout" ? "/checkout" : "/";

  const [initialForm, setInitialForm] = useState(initialValues);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================
  // LOAD ADDRESS
  // =========================================

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    let ignore = false;

    const loadAddress = async () => {
      try {
        setLoading(true);
        setError("");

        const address = await getAddress();

        if (ignore) {
          return;
        }

        if (address) {
          setInitialForm({
            recipientName: address.recipientName || "",
            recipientPhone: address.recipientPhone || "",
            province: address.province || "",
            city: address.city || "",
            addressLine: address.addressLine || "",
            postalCode: address.postalCode || "",
            plateNumber: address.plateNumber || "",
            unitNumber: address.unitNumber || "",
          });
        } else {
          setInitialForm({
            ...initialValues,
            recipientName: user?.username || "",
            recipientPhone: user?.phone || "",
          });
        }
      } catch (requestError) {
        console.error("Load address error:", requestError);

        if (!ignore) {
          setError(requestError.message || "خطا در دریافت آدرس.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadAddress();

    return () => {
      ignore = true;
    };
  }, [authLoading, isAuthenticated, user?.username, user?.phone]);

  // =========================================
  // AUTH LOADING
  // =========================================

  if (authLoading) {
    return (
      <div className="min-h-screen py-16 text-center text-zinc-400">
        در حال بررسی حساب کاربری...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // =========================================
  // ADDRESS LOADING
  // =========================================

  if (loading) {
    return (
      <div className="min-h-screen py-16 text-center text-zinc-400">
        در حال دریافت آدرس...
      </div>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div
      dir="rtl"
      className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-6"><BackPage fallback="/" /></div>
        <Link
          to="/"
          className="
            mb-6 inline-flex items-center gap-2
            rounded-xl border border-zinc-800 px-4 py-2.5
            text-sm text-zinc-300 transition
            hover:bg-zinc-900 hover:text-white
          "
        >
          <FiArrowRight />
          بازگشت به فروشگاه
        </Link>

        <Link
          to="/account/orders"
          className="
    mb-6 flex items-center justify-between gap-4
    rounded-2xl border border-zinc-700 bg-zinc-900
    p-4 transition hover:border-cyan-700 hover:bg-zinc-800
  "
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-950 p-3 text-cyan-300">
              <FiPackage className="text-xl" />
            </div>

            <div>
              <h2 className="font-bold">سفارش‌های من</h2>
              <p className="mt-1 text-sm text-zinc-400">
                مشاهده وضعیت سفارش‌ها و کد رهگیری ارسال
              </p>
            </div>
          </div>

          <FiArrowRight className="rotate-180 text-zinc-400" />
        </Link>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm text-emerald-400">
            {success}
          </div>
        )}

        <Formik
          initialValues={initialForm}
          enableReinitialize
          validate={validate}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              setError("");
              setSuccess("");

              const saved = await saveAddress({
                ...values,
                recipientPhone: normalizeDigits(values.recipientPhone),
                postalCode: normalizeDigits(values.postalCode),
              });

              setInitialForm({
                recipientName: saved.recipientName || "",
                recipientPhone: saved.recipientPhone || "",
                province: saved.province || "",
                city: saved.city || "",
                addressLine: saved.addressLine || "",
                postalCode: saved.postalCode || "",
                plateNumber: saved.plateNumber || "",
                unitNumber: saved.unitNumber || "",
              });

              // بعد از ذخیره موفق از صفحه آدرس خارج می‌شویم.
              navigate(returnTo, {
                replace: true,
                state: returnTo === "/checkout" ? { addressSaved: true } : null,
              });
            } catch (requestError) {
              console.error("Save address error:", requestError);

              setError(requestError.message || "خطا در ذخیره آدرس.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            setFieldValue,
            setFieldTouched,
            isSubmitting,
          }) => {
            const useAccountPhone = () => {
              if (!user?.phone) {
                return;
              }

              setFieldValue("recipientPhone", user.phone);
              setFieldTouched("recipientPhone", true, false);
            };

            return (
              <Form
                className="
                  rounded-3xl border border-zinc-800
                  bg-zinc-900 p-5 shadow-2xl sm:p-8
                "
              >
                <div className="mb-8 flex items-center gap-3">
                  <div className="rounded-xl bg-zinc-800 p-3">
                    <FiMapPin className="text-xl" />
                  </div>

                  <div>
                    <h2 className="font-bold">آدرس ارسال</h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      این اطلاعات برای ارسال سفارش استفاده می‌شود.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="نام گیرنده"
                    name="recipientName"
                    value={values.recipientName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.recipientName}
                    touched={touched.recipientName}
                  />

                  <div>
                    <Field
                      label="شماره تماس گیرنده"
                      name="recipientPhone"
                      value={values.recipientPhone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.recipientPhone}
                      touched={touched.recipientPhone}
                      dir="ltr"
                      inputMode="tel"
                    />

                    <button
                      type="button"
                      onClick={useAccountPhone}
                      disabled={!user?.phone}
                      className="
                        mt-2 text-xs text-zinc-400 transition
                        hover:text-white disabled:cursor-not-allowed
                        disabled:text-zinc-700
                      "
                    >
                      استفاده از شماره ثبت‌نام
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <IranLocationPicker
                    province={values.province}
                    city={values.city}
                    onProvinceChange={(value) => {
                      setFieldValue("province", value);
                      setFieldValue("city", "");
                    }}
                    onCityChange={(value) => setFieldValue("city", value)}
                    onProvinceBlur={() => setFieldTouched("province", true)}
                    onCityBlur={() => setFieldTouched("city", true)}
                    provinceError={errors.province}
                    cityError={errors.city}
                    provinceTouched={touched.province}
                    cityTouched={touched.city}
                  />
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  <Field
                    label="کد پستی"
                    name="postalCode"
                    value={values.postalCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.postalCode}
                    touched={touched.postalCode}
                    dir="ltr"
                    inputMode="numeric"
                  />

                  <Field
                    label="پلاک"
                    name="plateNumber"
                    value={values.plateNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.plateNumber}
                    touched={touched.plateNumber}
                    inputMode="numeric"
                    required={false}
                  />

                  <Field
                    label="واحد"
                    name="unitNumber"
                    value={values.unitNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.unitNumber}
                    touched={touched.unitNumber}
                    inputMode="numeric"
                    required={false}
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm text-zinc-300">
                    آدرس کامل
                  </label>

                  <textarea
                    name="addressLine"
                    value={values.addressLine}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={4}
                    placeholder="خیابان، کوچه، ساختمان و سایر جزئیات..."
                    className={`
                      w-full resize-none rounded-xl border
                      bg-zinc-950 px-4 py-3 text-white
                      outline-none transition
                      ${
                        errors.addressLine && touched.addressLine
                          ? "border-red-700"
                          : "border-zinc-700 focus:border-zinc-400"
                      }
                    `}
                  />

                  {errors.addressLine && touched.addressLine && (
                    <p className="mt-2 text-xs text-red-400">
                      {errors.addressLine}
                    </p>
                  )}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      inline-flex items-center gap-2
                      rounded-xl bg-white px-6 py-3
                      font-bold text-zinc-900 transition
                      hover:bg-zinc-200
                      disabled:cursor-not-allowed disabled:opacity-50
                    "
                  >
                    <FiSave />

                    {isSubmitting ? "در حال ذخیره..." : "ذخیره آدرس"}
                  </button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
};

const Field = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  dir,
  inputMode,
  required = true,
}) => (
  <div>
    <label className="mb-2 block text-sm text-zinc-300">{label}</label>

    <input
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      required={required}
      dir={dir}
      inputMode={inputMode}
      className={`
        w-full rounded-xl border bg-zinc-950
        px-4 py-3 text-white outline-none transition
        ${
          error && touched
            ? "border-red-700"
            : "border-zinc-700 focus:border-zinc-400"
        }
      `}
    />

    {error && touched && <p className="mt-2 text-xs text-red-400">{error}</p>}
  </div>
);

export default Account;
