import { useEffect, useState } from "react";
import { FiChevronDown, FiExternalLink, FiHelpCircle } from "react-icons/fi";
import BackPage from "../components/BackPage";
import { getPublicFaq } from "../services/faqApi";

const FaqPage = () => {
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getPublicFaq()
      .then((data) => {
        if (!controller.signal.aborted) setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <main dir="rtl" className="mx-auto min-h-[60vh] w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-7 flex items-center justify-between gap-3">
        <BackPage fallback="/" />
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400">
          <FiHelpCircle size={16} /> راهنمای خرید
        </span>
      </div>

      <header className="mb-8 rounded-3xl border border-white/[0.08] bg-slate-900/70 p-6 sm:p-9">
        <p className="text-sm font-semibold text-cyan-400">پاسخ پرسش‌های پرتکرار</p>
        <h1 className="mt-3 text-2xl font-black text-white sm:text-4xl">سؤالات متداول</h1>
        <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-300">
          پاسخ پرسش‌های رایج درباره خرید، پرداخت، ارسال و پیگیری سفارش را اینجا پیدا می‌کنی.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl border border-white/[0.06] bg-slate-900/60" />)}
        </div>
      ) : error ? (
        <p role="alert" className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 text-sm text-rose-300">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/50 p-8 text-center">
          <p className="font-semibold text-slate-200">در حال حاضر پرسشی ثبت نشده است.</p>
          <p className="mt-2 text-sm text-slate-400">در صورت نیاز از راه‌های ارتباطی فروشگاه کمک بگیر.</p>
        </div>
      ) : (
        <section aria-label="فهرست پرسش‌های متداول" className="space-y-3">
          {items.map((item) => {
            const isOpen = openId === item.id;
            const panelId = `faq-answer-${item.id}`;
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/55 transition-colors hover:border-cyan-400/20">
                <h2>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenId((current) => current === item.id ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-5 text-right text-sm font-bold leading-7 text-slate-100 outline-none transition-colors hover:text-cyan-300 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400 sm:px-6"
                  >
                    <span>{item.question}</span>
                    <FiChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 text-cyan-400 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </h2>
                <div
                  id={panelId}
                  aria-hidden={!isOpen}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="border-t border-white/[0.06] px-4 pb-5 pt-4 sm:px-6">
                      <p className="whitespace-pre-line text-sm leading-8 text-slate-300">{item.answer}</p>
                      {item.linkUrl && item.linkText && (
                        <a
                          href={item.linkUrl}
                          target={/^https?:\/\//i.test(item.linkUrl) ? "_blank" : undefined}
                          rel={/^https?:\/\//i.test(item.linkUrl) ? "noopener noreferrer" : undefined}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:underline"
                        >
                          {item.linkText}
                          {/^https?:\/\//i.test(item.linkUrl) && <FiExternalLink aria-hidden="true" size={14} />}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};

export default FaqPage;
