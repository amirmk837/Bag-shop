import FooterTop from "./FooterTop";
import { Link } from "react-router-dom";
import FooterAbout from "./FooterAbout";
import { useSiteSettings } from "../../context/useSiteSettings";
import FooterTrustBadges from "./FooterTrustBadges";

const Footer = () => {
  const { siteSettings: site } = useSiteSettings();

  return (
    <footer
      dir="rtl"
      className="
        site-footer-shell relative overflow-hidden
        border-t border-white/10
        bg-gradient-to-br from-black via-zinc-900 to-black
        px-4 py-8 text-white
        sm:px-6 sm:py-10
        md:px-10
      "
    >
      <div className="container relative mx-auto max-w-7xl">
        <FooterTop />
        <FooterTrustBadges />
        <div className="mt-8 sm:mt-10">
          <FooterAbout />
        </div>
        <div className="mt-8 border-t border-white/10 pt-5 text-center">
          <p className="text-xs text-zinc-500 sm:text-sm">
            {site?.footerCaption ||
              `© ${site?.storeName || "فروشگاه کاظمی"} — تمامی حقوق محفوظ است.`}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
