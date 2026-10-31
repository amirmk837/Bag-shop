import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../../services/api";

const Brands = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Categories error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading || categories.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 px-3 sm:mt-10 sm:px-5 md:px-6" dir="rtl">
      <div
        className="
          grid grid-cols-2 items-stretch gap-3
          sm:grid-cols-4 sm:gap-3 sm:px-0
          md:grid-cols-6 md:gap-5 md:px-4
          lg:grid-cols-8 lg:px-8
        "
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.slug}`}
            className="
              group relative min-w-0 overflow-hidden
              rounded-2xl border border-white/[0.08]
              bg-gradient-to-br from-zinc-600 via-zinc-700 to-black
              p-2 shadow-lg shadow-black/10
              transition-all duration-300 ease-out
              hover:-translate-y-1
              hover:border-cyan-400/40
              hover:shadow-xl hover:shadow-cyan-950/30
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-cyan-400
              sm:p-3
            "
          >
            {/* نور ملایم هنگام Hover */}
            <span
              aria-hidden="true"
              className="
                pointer-events-none absolute -right-10 -top-10
                h-24 w-24 rounded-full bg-cyan-400/0 blur-3xl
                transition-colors duration-500
                group-hover:bg-cyan-400/15
              "
            />

            {/* قاب تصویر */}
            <div
              className="
                relative flex aspect-[5/4] items-center
                justify-center overflow-hidden rounded-xl
                border border-white/[0.05]
                bg-zinc-950/50 p-2
                sm:p-3
              "
            >
              <img
                src={category.image}
                alt={category.name}
                loading="lazy"
                className="
                  h-full w-full object-contain
                  transition-transform duration-500
                  ease-out group-hover:scale-105
                "
              />
            </div>

            {/* عنوان دسته‌بندی */}
            <div className="relative flex items-center justify-center px-1 pb-1 pt-3">
              <h3
                className="
                  truncate text-center text-sm font-bold
                  text-zinc-200 transition-colors duration-300
                  group-hover:text-cyan-300
                  sm:text-base
                "
              >
                {category.name}
              </h3>
            </div>

            {/* خط تزئینی */}
            <span
              aria-hidden="true"
              className="
                absolute bottom-0 left-1/2 h-0.5 w-0
                -translate-x-1/2 rounded-full bg-cyan-400
                transition-all duration-300
                group-hover:w-1/3
              "
            />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Brands;
