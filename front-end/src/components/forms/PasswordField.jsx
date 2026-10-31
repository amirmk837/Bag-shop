import { useState } from "react";
import { useField } from "formik";
import { FiEye, FiEyeOff } from "react-icons/fi";

const PasswordField = ({ name, label, placeholder = "", autoComplete }) => {
  const [field, meta] = useField(name);

  const [visible, setVisible] = useState(false);
  const [touchMode, setTouchMode] = useState(false);

  const handlePointerDown = (event) => {
    if (event.pointerType === "touch") {
      setTouchMode(true);
      setVisible((prev) => !prev);
    }
  };

  const handleMouseEnter = () => {
    if (!touchMode) {
      setVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (!touchMode) {
      setVisible(false);
    }
  };

  const handleFocus = () => {
    if (!touchMode) {
      setVisible(true);
    }
  };

  const handleBlur = (event) => {
    field.onBlur(event);

    if (!touchMode) {
      setVisible(false);
    }
  };

  const hasError = meta.touched && meta.error;

  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm text-zinc-300">
        {label}
      </label>

      <div className="group relative">
        <input
          {...field}
          id={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            w-full rounded-xl border
            bg-zinc-950
            px-4 py-3 pl-12
            text-white
            outline-none
            transition-all duration-200
            ${
              hasError
                ? "border-red-700 focus:border-red-500"
                : "border-zinc-700 focus:border-zinc-300 focus:ring-1 focus:ring-zinc-500"
            }
          `}
        />

        <button
          type="button"
          aria-label={visible ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
          onPointerDown={handlePointerDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="
            absolute left-3 top-1/2
            flex h-9 w-9
            -translate-y-1/2
            items-center justify-center
            rounded-lg
            text-zinc-400
            transition-all duration-200
            hover:bg-zinc-800
            hover:text-white
            active:scale-90
          "
        >
          <span
            className={`
              flex
              transition-all duration-200
              ${
                visible ? "scale-110 rotate-6 text-white" : "scale-100 rotate-0"
              }
            `}
          >
            {visible ? <FiEyeOff size={19} /> : <FiEye size={19} />}
          </span>
        </button>
      </div>

      {hasError && <p className="mt-1 text-sm text-red-400">{meta.error}</p>}
    </div>
  );
};

export default PasswordField;
