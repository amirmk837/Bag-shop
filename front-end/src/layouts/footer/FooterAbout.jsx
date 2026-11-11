import { Link } from "react-router-dom";

const footerLinkClass =
  "inline-block text-sm font-medium text-zinc-400 transition-colors hover:text-cyan-500 focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4";

const FooterAbout = () => (
  <nav aria-label="پیوندهای راهنما" className="flex flex-wrap items-center gap-x-5 gap-y-2">
    <Link to="/about" className={footerLinkClass}>
      درباره ما
    </Link>
    <Link to="/faq" className={footerLinkClass}>
      پرسش‌های متداول
    </Link>
  </nav>
);

export default FooterAbout;
