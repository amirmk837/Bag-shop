import { useEffect, useState } from "react";
import { getSiteSettings } from "../../services/siteSettingsApi";

const FooterAbout = () => {
  const [site, setSite] = useState(null);
  useEffect(() => { getSiteSettings().then(setSite).catch(() => {}); }, []);
  return (
    <section
      aria-labelledby="footer-about-title"
      className="
        border-t border-white/10 pt-7
        sm:pt-8
      "
    >
      <div className="max-w-3xl">
        <h2
          id="footer-about-title"
          className="
            mb-3 text-lg font-bold text-white
            sm:text-xl
          "
        >
          درباره {site?.storeName || "فروشگاه کاظمی"}
        </h2>

        <p className="text-justify text-sm leading-8 text-zinc-400 sm:text-base sm:leading-9">
          {site?.footerAbout || "در فروشگاه کاظمی می‌توانید محصولات مرتبط با کیف، کوله‌پشتی و لوازم جانبی را مشاهده و بررسی کنید."}
        </p>
      </div>
    </section>
  );
};

export default FooterAbout;
