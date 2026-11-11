import { Link } from "react-router-dom";
import { useSiteSettings } from "../../context/useSiteSettings";

const FooterAbout = () => {
  const { siteSettings: site } = useSiteSettings();

  return (
    <section
      aria-labelledby="footer-about-title"
      className="border-t border-white/10 pt-7 sm:pt-8"
    >
      <div className="max-w-3xl">
        <h2 id="footer-about-title" className="mb-3 text-lg font-bold text-white sm:text-xl">
          درباره {site?.storeName || "فروشگاه کاظمی"}
        </h2>
        <p className="text-justify text-sm leading-8 text-zinc-400 sm:text-base sm:leading-9">
          {site?.footerAbout || "در فروشگاه کاظمی می‌توانید محصولات مرتبط با کیف، کوله‌پشتی و لوازم جانبی را مشاهده و بررسی کنید."}
        </p>
        <Link
          to="/about"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-500 transition hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          آشنایی بیشتر با فروشگاه
          <span aria-hidden="true">←</span>
        </Link>
      </div>
    </section>
  );
};

export default FooterAbout;
