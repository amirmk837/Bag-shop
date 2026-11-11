import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  getProductComments,
  submitProductComment,
} from "../services/feedbackApi";

const formatDate = (value) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
  }).format(new Date(value));

const ProductComments = ({ productCode }) => {
  const { user, loading: authLoading } = useAuth();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("COMMENT");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getProductComments(productCode, page);

      setComments(Array.isArray(result?.data) ? result.data : []);
      setTotalPages(Math.max(1, Number(result?.pagination?.totalPages) || 1));
      setTotalCount(Math.max(0, Number(result?.pagination?.total) || 0));
    } catch (loadError) {
      setError(loadError.message || "دریافت دیدگاه‌ها ممکن نیست.");
    } finally {
      setLoading(false);
    }
  }, [productCode, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadComments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadComments]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");

    if (content.trim().length < 10) {
      setError("متن باید حداقل ۱۰ نویسه باشد.");
      return;
    }

    setSending(true);

    try {
      await submitProductComment(productCode, {
        type,
        content: content.trim(),
      });

      setContent("");
      setNotice("دیدگاه شما ثبت شد و پس از بررسی مدیر نمایش داده می‌شود.");
    } catch (submitError) {
      setError(submitError.message || "ثبت دیدگاه انجام نشد.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className="
        theme-content-panel relative mt-6 overflow-hidden rounded-[26px]
        border border-cyan-900/40
        bg-gradient-to-br from-[#14243b] via-[#0c182c] to-[#101426]
        p-4 text-white
        shadow-[0_18px_50px_rgba(0,0,0,0.22)]
        sm:mt-8 sm:rounded-[30px] sm:p-6
      "
      dir="rtl"
    >
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/[0.06] blur-[80px]" />

      {/* سربرگ */}
      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

            <h2 className="text-lg font-extrabold text-white sm:text-xl">
              دیدگاه‌ها و پرسش‌ها
            </h2>
          </div>

          <p className="mt-2 text-xs leading-6 text-slate-400">
            دیدگاه‌ها پس از بررسی مدیر برای همه نمایش داده می‌شوند.
          </p>
        </div>

        <span
          className="
          rounded-full border border-cyan-400/20
          bg-cyan-400/[0.07] px-3 py-1.5
          text-xs font-semibold text-cyan-200
        "
        >
          {totalCount.toLocaleString("fa-IR")} دیدگاه
        </span>
      </div>

      {/* فرم ثبت دیدگاه */}
      {authLoading ? null : user?.role === "USER" ? (
        <form
          onSubmit={handleSubmit}
          className="
            relative mb-6 rounded-2xl
            border border-white/[0.07]
            bg-[#080f1d]/65 p-4
            shadow-inner sm:p-5
          "
        >
          <h3 className="mb-4 text-sm font-bold text-slate-200">
            نظر خود را با ما به اشتراک بگذارید
          </h3>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setType("COMMENT")}
              aria-pressed={type === "COMMENT"}
              className={`
                rounded-xl border px-4 py-2.5
                text-xs font-semibold
                transition-all duration-300 active:scale-95
                ${
                  type === "COMMENT"
                    ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.08)]"
                    : "border-white/[0.08] bg-white/[0.035] text-slate-400 hover:border-cyan-400/30 hover:text-cyan-200"
                }
              `}
            >
              ثبت دیدگاه
            </button>

            <button
              type="button"
              onClick={() => setType("QUESTION")}
              aria-pressed={type === "QUESTION"}
              className={`
                rounded-xl border px-4 py-2.5
                text-xs font-semibold
                transition-all duration-300 active:scale-95
                ${
                  type === "QUESTION"
                    ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.08)]"
                    : "border-white/[0.08] bg-white/[0.035] text-slate-400 hover:border-cyan-400/30 hover:text-cyan-200"
                }
              `}
            >
              پرسیدن سؤال
            </button>
          </div>

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={1500}
            rows={4}
            placeholder="متن دیدگاه یا پرسش خود را بنویسید..."
            className="
              w-full resize-y rounded-xl
              border border-white/10
              bg-[#101c31] p-3
              text-sm leading-8 text-slate-200
              outline-none placeholder:text-slate-600
              transition-all duration-300
              focus:border-cyan-400/50
              focus:ring-2 focus:ring-cyan-400/10
            "
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs tabular-nums text-slate-500">
              {content.length.toLocaleString("fa-IR")} / ۱۵۰۰
            </span>

            <button
              type="submit"
              disabled={sending || content.trim().length < 10}
              className="
                rounded-xl border border-cyan-300/30
                bg-gradient-to-r from-cyan-500 to-cyan-400
                px-5 py-2.5
                text-sm font-bold text-[#07101f]
                shadow-[0_5px_20px_rgba(34,211,238,0.12)]
                transition-all duration-300
                hover:shadow-[0_8px_25px_rgba(34,211,238,0.2)]
                active:scale-95
                disabled:cursor-not-allowed disabled:opacity-40
                disabled:shadow-none
              "
            >
              {sending ? "در حال ثبت..." : "ارسال برای بررسی"}
            </button>
          </div>
        </form>
      ) : user?.role !== "ADMIN" ? (
        <div
          className="
          relative mb-6 rounded-2xl
          border border-white/[0.07]
          bg-[#080f1d]/65 p-4
          text-sm leading-7 text-slate-300
        "
        >
          برای ثبت دیدگاه یا پرسش، ابتدا{" "}
          <Link
            className="
              font-bold text-cyan-300 underline
              underline-offset-4 transition-colors
              hover:text-cyan-200
            "
            to="/login"
          >
            وارد حساب کاربری
          </Link>{" "}
          شوید.
        </div>
      ) : null}

      {/* پیام خطا */}
      {error && (
        <p
          role="alert"
          className="
            relative mb-4 rounded-xl
            border border-rose-400/20
            bg-rose-500/[0.08] p-3
            text-sm leading-7 text-rose-300
          "
        >
          {error}
        </p>
      )}

      {/* پیام موفقیت */}
      {notice && (
        <p
          role="status"
          className="
            relative mb-4 rounded-xl
            border border-emerald-400/20
            bg-emerald-500/[0.08] p-3
            text-sm leading-7 text-emerald-300
          "
        >
          {notice}
        </p>
      )}

      {/* فهرست دیدگاه‌ها */}
      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="
                animate-pulse rounded-2xl
                border border-white/[0.06]
                bg-[#080f1d]/50 p-4
              "
            >
              <div className="mb-4 h-3 w-28 rounded-full bg-white/10" />
              <div className="h-3 w-full rounded-full bg-white/[0.06]" />
              <div className="mt-3 h-3 w-2/3 rounded-full bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p
          className="
          relative rounded-2xl
          border border-dashed border-white/10
          bg-[#080f1d]/45 px-4 py-8
          text-center text-sm leading-7 text-slate-500
        "
        >
          هنوز دیدگاهی برای این محصول ثبت نشده است.
        </p>
      ) : (
        <div className="relative space-y-3">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="
                rounded-2xl border border-white/[0.07]
                bg-gradient-to-br from-[#101e33]/90 to-[#080f1d]/80
                p-4 transition-all duration-300
                hover:border-cyan-400/20
                sm:p-5
              "
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="break-words text-sm font-bold text-slate-200">
                    {comment.author}
                  </span>

                  <span
                    className="
                    rounded-lg border border-cyan-400/15
                    bg-cyan-400/[0.07] px-2.5 py-1
                    text-[10px] font-semibold text-cyan-200
                  "
                  >
                    {comment.type === "QUESTION" ? "پرسش" : "دیدگاه"}
                  </span>
                </div>

                <time className="shrink-0 text-xs text-slate-500">
                  {formatDate(comment.createdAt)}
                </time>
              </div>

              <p
                className="
                whitespace-pre-wrap break-words
                text-sm leading-8 text-slate-300
              "
              >
                {comment.content}
              </p>

              {comment.adminReply && (
                <div
                  className="
                  mt-4 rounded-xl
                  border border-cyan-400/15
                  border-r-[3px] border-r-cyan-400
                  bg-cyan-400/[0.045] p-3 sm:p-4
                "
                >
                  <p className="mb-2 text-xs font-bold text-cyan-300">
                    پاسخ فروشگاه
                  </p>

                  <p
                    className="
                    whitespace-pre-wrap break-words
                    text-sm leading-8 text-slate-200
                  "
                  >
                    {comment.adminReply}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div
          className="
          relative mt-6 flex flex-wrap
          items-center justify-center gap-3
          border-t border-white/[0.06] pt-5
          text-sm text-slate-400
        "
        >
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="
              rounded-xl border border-white/10
              bg-white/[0.035] px-4 py-2
              transition-all duration-300
              hover:border-cyan-400/30 hover:text-cyan-200
              active:scale-95
              disabled:cursor-not-allowed disabled:opacity-35
            "
          >
            قدیمی‌تر
          </button>

          <span className="text-xs tabular-nums text-slate-400">
            صفحه {page.toLocaleString("fa-IR")} از{" "}
            {totalPages.toLocaleString("fa-IR")}
          </span>

          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="
              rounded-xl border border-white/10
              bg-white/[0.035] px-4 py-2
              transition-all duration-300
              hover:border-cyan-400/30 hover:text-cyan-200
              active:scale-95
              disabled:cursor-not-allowed disabled:opacity-35
            "
          >
            جدیدتر
          </button>
        </div>
      )}
    </section>
  );
};

export default ProductComments;
