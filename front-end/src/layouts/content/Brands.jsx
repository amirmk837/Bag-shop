import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../../services/api";

const Brands = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        if (active) setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Categories error:", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadCategories();
    return () => { active = false; };
  }, []);

  if (loading || categories.length === 0) return null;

  return (
    <section id="store-categories" className="relative mx-auto mt-14 w-full max-w-7xl scroll-mt-28 px-3 sm:mt-20 sm:px-6 lg:px-8" dir="rtl">
      <div className="mb-6 flex flex-col gap-3 border-b border-white/[0.08] pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 text-[10px] font-black tracking-[.18em] text-cyan-300 sm:text-[11px]">EXPLORE COLLECTIONS</div>
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl lg:text-3xl">دسته‌بندی محصولات</h2>
          <p className="mt-2 text-xs leading-6 text-zinc-500 sm:text-sm">برای پیدا کردن محصول موردنظرت، از دسته‌بندی‌ها شروع کن.</p>
        </div>
        <span className="hidden rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-semibold text-zinc-400 sm:inline-flex">{categories.length.toLocaleString("fa-IR")} دسته‌بندی</span>
      </div>

      <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
            className="group relative isolate min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111a27] p-2.5 shadow-[0_12px_34px_rgba(0,0,0,.18)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-[#152233] hover:shadow-[0_20px_45px_rgba(0,0,0,.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:rounded-[1.4rem] sm:p-3.5"
          >
            <span aria-hidden="true" className={`pointer-events-none absolute -left-10 -top-12 -z-10 h-32 w-32 rounded-full blur-[55px] transition-opacity duration-500 group-hover:opacity-100 ${index % 2 === 0 ? "bg-cyan-400/15 opacity-50" : "bg-violet-400/15 opacity-40"}`} />
            <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-[radial-gradient(ellipse_at_50%_45%,rgba(255,255,255,.07),transparent_68%),linear-gradient(145deg,#1b2838,#0b111a)] p-3 sm:rounded-2xl sm:p-5">
              <img src={category.image} alt={category.name} loading="lazy" decoding="async" className="h-full w-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,.3)] transition duration-500 group-hover:scale-110" />
              <span aria-hidden="true" className="absolute bottom-2 left-2 rounded-md border border-white/10 bg-black/35 px-2 py-1 text-[8px] font-bold tracking-[.14em] text-zinc-400">COLLECTION</span>
            </div>
            <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-3">
              <h3 className="truncate text-xs font-extrabold text-zinc-100 transition-colors group-hover:text-cyan-200 sm:text-sm">{category.name}</h3>
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-xs text-zinc-400 transition group-hover:border-cyan-300/25 group-hover:bg-cyan-300/10 group-hover:text-cyan-200">←</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Brands;
