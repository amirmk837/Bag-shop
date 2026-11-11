import { Formik, Form, Field } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useAuth } from "../../context/useAuth";
import PasswordField from "../../components/forms/PasswordField";
import ThemeToggle from "../../components/ThemeToggle";

// VALIDATION
// =========================================
const loginSchema = Yup.object({
  identifier: Yup.string()
    .trim()
    .required("نام کاربری یا شماره تماس را وارد کنید."),

  password: Yup.string()
    .required("رمز عبور را وارد کنید.")
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد.")
    .max(72, "رمز عبور بیش از حد مجاز است.")
    .matches(
      /^[\x21-\x7E]+$/,
      "رمز عبور فقط شامل حروف انگلیسی، عدد و علامت باشد.",
    ),
});

// COMPONENT
// =========================================
const AdminLogin = () => {
  const navigate = useNavigate();

  const { login, logout } = useAuth();

  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-zinc-950 px-4"
    >
      <div className="absolute left-4 top-4">
        <ThemeToggle />
      </div>
      <Formik
        initialValues={{
          identifier: "",
          password: "",
        }}
        validationSchema={loginSchema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          setStatus("");

          try {
            const user = await login(values.identifier, values.password);

            if (!user || !user.role) {
              await logout();

              throw new Error("اطلاعات کاربر پس از ورود دریافت نشد.");
            }

            if (user.role !== "ADMIN") {
              await logout();

              setStatus("این حساب دسترسی مدیر ندارد.");

              return;
            }

            navigate("/admin");
          } catch (error) {
            setStatus(error.message || "ورود ناموفق بود.");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting, status }) => (
          <Form
            className="
              w-full
              max-w-md
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-900
              p-6
              shadow-2xl
              transition-transform
              duration-300
              hover:-translate-y-0.5
            "
          >
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-white">ورود مدیر</h1>

              <p className="mt-2 text-sm text-zinc-400">
                برای ورود به پنل مدیریت وارد شوید.
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
              className="
                w-full
                rounded-xl
                border
                border-zinc-700
                bg-zinc-950
                px-4
                py-3
                text-white
                outline-none
                transition
                duration-200
                focus:border-zinc-300
                focus:ring-1
                focus:ring-zinc-500
              "
            />

            {touched.identifier && errors.identifier && (
              <p className="mt-1 text-sm text-red-400">{errors.identifier}</p>
            )}

            <PasswordField
              name="password"
              label="رمز عبور"
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="
                mt-6
                w-full
                rounded-xl
                bg-white
                px-4
                py-3
                font-bold
                text-zinc-900
                transition
                duration-200
                hover:bg-zinc-200
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {isSubmitting ? "در حال ورود..." : "ورود"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AdminLogin;
