import { useEffect, useState } from "react";
import { FiAlertTriangle, FiCheck, FiX } from "react-icons/fi";

const FeedbackDialog = ({
  open,
  type = "error",
  title,
  message,
  confirmText = "تأیید",
  cancelText = "انصراف",
  onConfirm,
  onClose,
}) => {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !confirming) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, confirming, onClose]);

  if (!open) {
    return null;
  }

  const isConfirm = type === "confirm";

  const handleConfirm = async () => {
    if (!onConfirm || confirming) {
      return;
    }

    try {
      setConfirming(true);

      const result = await onConfirm();

      // false یعنی callback خودش Dialog دیگری باز کرده
      if (result !== false) {
        onClose();
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-black/70
        px-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !confirming) {
          onClose();
        }
      }}
    >
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        className="
          w-full max-w-md
          overflow-hidden
          rounded-3xl
          border border-zinc-700
          bg-zinc-900
          shadow-2xl
        "
      >
        {/* Header */}

        <div className="flex items-start gap-4 p-6">
          <div
            className={`
              flex h-12 w-12 shrink-0
              items-center justify-center
              rounded-2xl

              ${
                isConfirm
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-red-500/10 text-red-400"
              }
            `}
          >
            {isConfirm ? <FiAlertTriangle size={24} /> : <FiX size={24} />}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-white">{title}</h3>

            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-zinc-400">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}

        <div
          className="
            flex
            flex-col-reverse
            gap-3
            border-t
            border-zinc-800
            bg-zinc-950/40
            p-4
            sm:flex-row
            sm:justify-end
          "
        >
          {isConfirm && (
            <button
              type="button"
              onClick={onClose}
              disabled={confirming}
              className="
                rounded-xl
                border border-zinc-700
                px-5 py-2.5
                text-sm font-bold
                text-zinc-300
                transition
                hover:bg-zinc-800
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={isConfirm ? handleConfirm : onClose}
            disabled={confirming}
            className={`
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              px-5 py-2.5
              text-sm font-bold
              transition
              disabled:cursor-not-allowed
              disabled:opacity-50

              ${
                isConfirm
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white text-zinc-900 hover:bg-zinc-200"
              }
            `}
          >
            {confirming ? (
              "در حال انجام..."
            ) : isConfirm ? (
              <>
                <FiCheck size={17} />
                {confirmText}
              </>
            ) : (
              "متوجه شدم"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDialog;
