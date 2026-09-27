import FooterTop from "./FooterTop";
import FooterAbout from "./FooterAbout";

const Footer = () => {
  return (
    <footer
      className="
        bg-gradient-to-br
        from-zinc-900
        via-zinc-700
        to-zinc-900
        px-4
        py-8
        sm:px-6
        sm:py-10
        md:px-10
      "
    >
      <div className="container mx-auto">
        {/* نوار بالایی */}
        <FooterTop />

        {/* درباره ما */}
        <div className="mt-8 sm:mt-10">
          <FooterAbout />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
