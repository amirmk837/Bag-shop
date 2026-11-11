import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiCompass, FiHeart, FiShield, FiTarget } from "react-icons/fi";
import { getPublicAboutPage } from "../services/aboutPageApi";
import BackPage from "../components/BackPage";

const AboutPage = () => {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getPublicAboutPage()
      .then((data) => { if (!controller.signal.aborted) setPage(data); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  if (loading) return <main dir="rtl" aria-busy="true" className="mx-auto min-h-[60vh] max-w-5xl px-4 py-16"><div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-700/50" /><div className="mt-6 h-28 animate-pulse rounded-2xl bg-zinc-800/60" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="h-36 animate-pulse rounded-2xl bg-zinc-800/50" /><div className="h-36 animate-pulse rounded-2xl bg-zinc-800/50" /></div></main>;

  if (error || !page) return (
    <main dir="rtl" className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p role="alert" className="text-sm text-zinc-500">{error || "محتوای این صفحه در دسترس نیست."}</p>
      <BackPage fallback="/" />
    </main>
  );

  const sections = [
    { title: "مأموریت ما", text: page.mission, Icon: FiTarget },
    { title: "چشم‌انداز ما", text: page.vision, Icon: FiCompass },
  ].filter((item) => item.text);

  return (
    <main dir="rtl" className="mx-auto min-h-[60vh] w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-7 flex items-center justify-between gap-3"><BackPage fallback="/" /><span className="text-xs font-semibold text-cyan-500">{page.eyebrow}</span></div>
      <header className="rounded-3xl border border-white/10 bg-zinc-900/60 px-5 py-10 sm:px-10 sm:py-14">
        <p className="text-sm font-semibold text-cyan-500">{page.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">{page.title}</h1>
        {page.intro && <p className="mt-5 max-w-3xl text-sm leading-8 text-zinc-300 sm:text-base sm:leading-9">{page.intro}</p>}
      </header>

      {page.story && <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/50 p-5 sm:p-8">
        <h2 className="text-xl font-bold text-white sm:text-2xl">{page.storyTitle}</h2>
        <p className="mt-4 whitespace-pre-line text-justify text-sm leading-9 text-zinc-300 sm:text-base">{page.story}</p>
      </section>}

      {sections.length > 0 && <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {sections.map(({ title, text, Icon }) => <article key={title} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 sm:p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500"><Icon size={21} /></span>
          <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-8 text-zinc-300">{text}</p>
        </article>)}
      </section>}

      {page.values?.length > 0 && <section className="mt-10">
        <div className="mb-5"><p className="text-xs font-semibold text-cyan-500">آنچه به آن پایبندیم</p><h2 className="mt-2 text-2xl font-black text-white">ارزش‌های ما</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {page.values.map((item, index) => <article key={item.title} className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-cyan-500">{index === 0 ? <FiShield /> : index === 1 ? <FiHeart /> : <FiCompass />}</span>
            <h3 className="mt-3 font-bold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-zinc-400">{item.description}</p>
          </article>)}
        </div>
      </section>}

      {page.contactText && <section className="mt-10 flex flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div><h2 className="text-lg font-bold text-white">در ارتباط باشیم</h2><p className="mt-2 text-sm leading-7 text-zinc-400">{page.contactText}</p></div>
        <Link to="/" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5">بازگشت به فروشگاه <FiArrowLeft /></Link>
      </section>}
    </main>
  );
};

export default AboutPage;
