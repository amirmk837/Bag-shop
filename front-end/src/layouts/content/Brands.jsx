import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../../services/api";

const Brands = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getCategories()
      .then((data) => {
        if (active) {
          setCategories(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        console.error("Categories error:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const parents = categories.filter((category) => !category.parentId);

  if (loading || !parents.length) return null;

  return (
    <section
      id="store-categories"
      dir="rtl"
      className="
        relative mx-auto mt-16 w-full max-w-[1500px]
        scroll-mt-28 px-3
        sm:mt-24 sm:px-6
        lg:mt-28 lg:px-8
      "
    >
      {/* Ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-10 -z-10 h-64 w-64 rounded-full bg-cyan-500/[0.07] blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-0 -z-10 h-64 w-64 rounded-full bg-violet-500/[0.07] blur-[100px]"
      />

      {/* Section heading */}
      <div className="mb-7 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2"></div>
        </div>

        <div
          className="
            flex w-fit items-center gap-3 rounded-2xl
            border border-white/[0.09]
            bg-gradient-to-l from-white/[0.065] to-white/[0.025]
            px-4 py-3 shadow-lg backdrop-blur-xl
          "
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.09]">
            <span className="text-lg font-black text-cyan-200">
              {parents.length.toLocaleString("fa-IR")}
            </span>
          </div>

          <div>
            <span className="block text-xs font-bold text-white">
              دسته‌بندی اصلی
            </span>
            <span className="mt-1 block text-[10px] text-zinc-500">
              انتخاب و مشاهده محصولات
            </span>
          </div>
        </div>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {parents.map((category, index) => (
          <article
            key={category.id}
            className="
              group relative isolate min-w-0
              overflow-hidden rounded-[1.35rem]
              border border-white/[0.09]
              bg-gradient-to-br from-[#172536] via-[#101b29] to-[#0b121d]
              p-2.5
              shadow-[0_12px_35px_rgba(0,0,0,.2)]
              transition-all duration-500
              hover:-translate-y-1.5
              hover:border-cyan-300/30
              hover:shadow-[0_22px_55px_rgba(0,0,0,.32)]
              sm:rounded-[1.7rem] sm:p-3
            "
          >
            {/* Card glow */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute -left-16 -top-16 -z-10
                h-40 w-40 rounded-full
                bg-cyan-400/[0.08] blur-[65px]
                transition-all duration-700
                group-hover:bg-cyan-300/[0.18]
                group-hover:scale-150
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute -bottom-20 -right-16 -z-10
                h-40 w-40 rounded-full
                bg-violet-500/[0.07] blur-[65px]
                transition-all duration-700
                group-hover:bg-violet-400/[0.13]
              "
            />

            <Link
              to={`/category/${category.slug}`}
              className="
                block rounded-xl
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-cyan-300
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[#101b29]
              "
            >
              {/* Image area */}
              <div
                className="
                  relative flex aspect-[5/4]
                  items-center justify-center
                  overflow-hidden rounded-[1rem]
                  border border-white/[0.07]
                  bg-[radial-gradient(ellipse_at_50%_42%,rgba(65,145,180,.15),transparent_65%),linear-gradient(145deg,#202f40,#101925_65%,#0b121c)]
                  p-3
                  sm:rounded-[1.35rem] sm:p-5
                "
              >
                {/* Image background decoration */}
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none absolute inset-0
                    bg-[linear-gradient(135deg,rgba(255,255,255,.045),transparent_40%,rgba(34,211,238,.035))]
                  "
                />

                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none absolute left-1/2 top-1/2
                    h-[65%] w-[65%] -translate-x-1/2
                    -translate-y-1/2 rounded-full
                    border border-white/[0.045]
                    transition-transform duration-700
                    group-hover:scale-125
                    group-hover:border-cyan-200/[0.12]
                  "
                />

                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    decoding="async"
                    className="
                      relative z-[1] h-full w-full
                      object-contain
                      drop-shadow-[0_15px_20px_rgba(0,0,0,.4)]
                      transition-transform duration-700
                      ease-out
                      group-hover:scale-110
                    "
                  />
                ) : (
                  <div className="relative z-[1] flex flex-col items-center gap-2 text-zinc-500">
                    <span className="text-3xl opacity-50">◇</span>
                    <span className="text-[10px] font-semibold">
                      تصویر دسته‌بندی
                    </span>
                  </div>
                )}

                {/* Index */}
                <span
                  dir="ltr"
                  className="
                    absolute right-2.5 top-2.5 z-[2]
                    text-[10px] font-bold
                    tracking-widest text-white/35
                    sm:right-3 sm:top-3
                  "
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Category title */}
              <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-3 sm:px-1.5 sm:pt-4">
                <div className="min-w-0">
                  <h3
                    className="
                    truncate text-sm font-black text-white
                    transition-colors duration-300
                    group-hover:text-cyan-200
                    sm:text-base
                  "
                  >
                    {category.name}
                  </h3>

                  <p className="mt-1 text-[9px] font-medium text-zinc-500 sm:text-[10px]">
                    مشاهده محصولات برند
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="
                    flex h-8 w-8 shrink-0
                    items-center justify-center
                    rounded-xl border border-white/[0.09]
                    bg-white/[0.045] text-sm text-zinc-400
                    transition-all duration-300
                    group-hover:-translate-x-1
                    group-hover:border-cyan-300/30
                    group-hover:bg-cyan-300/10
                    group-hover:text-cyan-200
                    sm:h-9 sm:w-9
                  "
                >
                  ←
                </span>
              </div>
            </Link>

            {/* Child categories */}
            {category.children?.length > 0 && (
              <div className="mt-2.5 border-t border-white/[0.075] pt-2.5 sm:mt-3 sm:pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-zinc-500">
                    زیرمجموعه‌ها
                  </span>

                  <span className="text-[9px] text-zinc-600">
                    {category.children.length.toLocaleString("fa-IR")}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {category.children.map((child) => (
                    <Link
                      key={child.id}
                      to={`/category/${child.slug}`}
                      className="
                        rounded-lg border border-white/[0.08]
                        bg-white/[0.035] px-2 py-1.5
                        text-[9px] font-semibold text-zinc-400
                        transition-all duration-300
                        hover:border-cyan-300/30
                        hover:bg-cyan-300/[0.09]
                        hover:text-cyan-100
                        sm:text-[10px]
                      "
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default Brands;
