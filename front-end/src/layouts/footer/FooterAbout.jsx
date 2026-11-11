import { Link } from "react-router-dom";

const FooterAbout = () => (
  <Link
    to="/about"
    className="inline-block text-sm font-medium text-zinc-400 transition-colors hover:text-cyan-500 focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4"
  >
    درباره ما
  </Link>
);

export default FooterAbout;
