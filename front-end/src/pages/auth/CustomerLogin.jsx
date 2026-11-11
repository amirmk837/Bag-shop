import { Formik, Form, Field } from "formik";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useAuth } from "../../context/useAuth";
import PasswordField from "../../components/forms/PasswordField";

const normalizeLoginDigits = (value = "") =>
  String(value)
    .replace(/[۰-۹]/g, (digit) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(digit)])
    .replace(/[٠-٩]/g, (digit) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(digit)]);

const iranianPhonePattern = /^(09\d{9}|\+989\d{9}|00989\d{9})$/;

const loginSchema = Yup.object({
  identifier: Yup.string()
    .trim()
    .required("نام کاربری یا شماره تماس را وارد کنید."),
  password: Yup.string()
    .required("رمز عبور را وارد کنید.")
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.")
    .matches(
      /^[\x21-\x7E]+$/,
      "رمز عبور فقط باید شامل حروف انگلیسی، عدد و علامت باشد.",
    )
    .max(72, "رمز عبور بیش از حد مجاز است."),
});

const CustomerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  return (
    <div
      dir="rtl"
      className="flex min-h-[60vh] items-center justify-center bg-transparent px-4 py-10"
    >
      <Formik
        initialValues={{
          identifier: "",
          password: "",
        }}
        validationSchema={loginSchema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          setStatus("");

          try {
            const normalizedIdentifier = normalizeLoginDigits(values.identifier).trim();
            const isPhoneIdentifier = iranianPhonePattern.test(normalizedIdentifier);
            const user = await login(
              isPhoneIdentifier ? normalizedIdentifier : values.identifier,
              values.password,
            );

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

            navigate(user.role === "ADMIN" ? "/admin" : returnPath, {
              replace: true,
            });
          } catch (error) {
            setStatus(error.message || "ورود ناموفق بود.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting, status }) => (
          <Form className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-white">ورود به حساب</h1>

              <p className="mt-2 text-sm text-zinc-400">
                با نام کاربری یا شماره تماس وارد شوید.
              </p>
            </div>

            {status && (
              <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
                {status}
              </div>
            )}

            <label className="mb-2 block text-sm text-zinc-300">
              نام کاربری یا شماره تماس
            </label>

            <Field
              name="identifier"
              autoComplete="username"
              className="mb-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-400"
            />

            {touched.identifier && errors.identifier && (
              <p className="mb-4 text-sm text-red-400">{errors.identifier}</p>
            )}

            <PasswordField
              name="password"
              label="رمز عبور"
              autoComplete="current-password"
            />

            {touched.password && errors.password && (
              <p className="mb-4 text-sm text-red-400">{errors.password}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-bold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "در حال ورود..." : "ورود"}
            </button>

            <p className="mt-6 text-center text-sm text-zinc-400">
              حساب ندارید؟{" "}
              <Link to="/register" className="text-white hover:underline">
                ثبت‌نام
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CustomerLogin;
