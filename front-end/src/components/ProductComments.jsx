import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getProductComments, submitProductComment } from "../services/feedbackApi";

const formatDate = (value) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(value));

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
    const timer = window.setTimeout(() => { void loadComments(); }, 0);
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
      await submitProductComment(productCode, { type, content: content.trim() });
      setContent("");
      setNotice("دیدگاه شما ثبت شد و پس از بررسی مدیر نمایش داده می‌شود.");
    } catch (submitError) {
      setError(submitError.message || "ثبت دیدگاه انجام نشد.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-white sm:p-6" dir="rtl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold sm:text-xl">دیدگاه‌ها و پرسش‌ها</h2>
          <p className="mt-1 text-xs text-zinc-500">دیدگاه‌ها پس از بررسی مدیر برای همه نمایش داده می‌شوند.</p>
        </div>
        <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{totalCount.toLocaleString("fa-IR")} دیدگاه</span>
      </div>

      {authLoading ? null : user?.role === "USER" ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setType("COMMENT")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${type === "COMMENT" ? "bg-cyan-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>ثبت دیدگاه</button>
            <button type="button" onClick={() => setType("QUESTION")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${type === "QUESTION" ? "bg-cyan-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}>پرسیدن سؤال</button>
          </div>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={1500} rows={4} placeholder="متن دیدگاه یا پرسش خود را بنویسید..." className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm leading-7 outline-none focus:border-cyan-500" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-zinc-500">{content.length.toLocaleString("fa-IR")} / ۱۵۰۰</span>
            <button disabled={sending || content.trim().length < 10} className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40">{sending ? "در حال ثبت..." : "ارسال برای بررسی"}</button>
          </div>
        </form>
      ) : user?.role !== "ADMIN" ? (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
          برای ثبت دیدگاه یا پرسش، ابتدا <Link className="font-bold text-cyan-300 underline" to="/login">وارد حساب کاربری</Link> شوید.
        </div>
      ) : null}

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-950/40 p-3 text-sm text-emerald-300">{notice}</p>}

      {loading ? <p className="py-5 text-center text-sm text-zinc-500">در حال دریافت دیدگاه‌ها...</p> : comments.length === 0 ? (
        <p className="rounded-xl bg-zinc-950/60 px-4 py-6 text-center text-sm text-zinc-500">هنوز دیدگاهی برای این محصول ثبت نشده است.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">{comment.author}</span>
                  <span className="rounded-md bg-zinc-800 px-2 py-1 text-[10px] text-cyan-200">{comment.type === "QUESTION" ? "پرسش" : "دیدگاه"}</span>
                </div>
                <time className="text-xs text-zinc-500">{formatDate(comment.createdAt)}</time>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">{comment.content}</p>
              {comment.adminReply && <div className="mt-4 rounded-lg border-r-2 border-cyan-500 bg-cyan-950/20 p-3"><p className="mb-1 text-xs font-bold text-cyan-300">پاسخ فروشگاه</p><p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">{comment.adminReply}</p></div>}
            </article>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm text-zinc-400">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">قدیمی‌تر</button>
          <span>صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">جدیدتر</button>
        </div>
      )}
    </section>
  );
};

export default ProductComments;
