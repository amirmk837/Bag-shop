import { Formik, Form, Field } from "formik";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import PasswordField from "../../components/forms/PasswordField";
import { useAuth } from "../../context/useAuth";

const passwordRule = /^[\x21-\x7E]+$/;

const normalizePhoneDigits = (value = "") =>
  String(value)
    .replace(/[۰-۹]/g, (digit) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(digit)])
    .replace(/[٠-٩]/g, (digit) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(digit)]);

const phoneRule = /^(09\d{9}|\+989\d{9}|00989\d{9})$/;

const registerSchema = Yup.object({
  username: Yup.string()
    .trim()
    .required("نام کاربری را وارد کنید.")
    .min(3, "نام کاربری حداقل ۳ کاراکتر باشد.")
    .max(30, "نام کاربری بیش از ۳۰ کاراکتر نباشد."),

  phone: Yup.string()
    .transform((value) => normalizePhoneDigits(value).trim())
    .trim()
    .required("شماره تماس را وارد کنید.")
    .matches(phoneRule, "شماره تماس معتبر وارد کنید."),

  password: Yup.string()
    .required("رمز عبور را وارد کنید.")
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.")
    .max(72, "رمز عبور بیش از حد مجاز است.")
    .matches(
      passwordRule,
      "رمز عبور فقط باید شامل حروف انگلیسی، عدد و علامت باشد.",
    ),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "تکرار رمز عبور یکسان نیست.")
    .required("تکرار رمز عبور را وارد کنید."),
});

const CustomerRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-zinc-950 px-4"
    >
      <Formik
        initialValues={{
          username: "",
          phone: "",
          password: "",
          confirmPassword: "",
        }}
        validationSchema={registerSchema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          setStatus("");

          try {
            await register(values.username, normalizePhoneDigits(values.phone).trim(), values.password);

            const from = location.state?.from;
            const returnPath =
              typeof from?.pathname === "string" &&
              from.pathname.startsWith("/") &&
              !from.pathname.startsWith("//") &&
              !from.pathname.startsWith("/admin") &&
              from.pathname !== "/login" &&
              from.pathname !== "/register"
                ? `${from.pathname}${from.search || ""}${from.hash || ""}`
                : "/";

            navigate(returnPath, { replace: true });
          } catch (error) {
            setStatus(error.message || "ثبت‌نام ناموفق بود.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting, status }) => (
          <Form className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-white">ساخت حساب</h1>

              <p className="mt-2 text-sm text-zinc-400">
                برای خرید در فروشگاه حساب بسازید.
              </p>
            </div>

            {status && (
              <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
                {status}
              </div>
            )}

            <label className="mb-2 block text-sm text-zinc-300">
              نام کاربری
            </label>

            <Field
              name="username"
              autoComplete="username"
              className="mb-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
            />

            {touched.username && errors.username && (
              <p className="mb-4 text-sm text-red-400">{errors.username}</p>
            )}

            <label className="mb-2 mt-4 block text-sm text-zinc-300">
              شماره تماس
            </label>

            <Field
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="09121234567"
              className="mb-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
            />

            {touched.phone && errors.phone && (
              <p className="mb-4 text-sm text-red-400">{errors.phone}</p>
            )}

            <PasswordField
              name="password"
              label="رمز عبور"
              autoComplete="new-password"
            />

            {touched.password && errors.password && (
              <p className="mb-4 text-sm text-red-400">{errors.password}</p>
            )}

            <PasswordField
              name="confirmPassword"
              label="تکرار رمز عبور"
              autoComplete="new-password"
            />

            {touched.confirmPassword && errors.confirmPassword && (
              <p className="mb-4 text-sm text-red-400">
                {errors.confirmPassword}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-bold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "در حال ساخت حساب..." : "ثبت‌نام"}
            </button>

            <p className="mt-6 text-center text-sm text-zinc-400">
              قبلاً حساب ساخته‌اید؟{" "}
              <Link to="/login" className="text-white hover:underline">
                ورود
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CustomerRegister;
