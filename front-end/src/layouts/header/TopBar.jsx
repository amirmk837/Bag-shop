import { FiPhone } from "react-icons/fi";
import { FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";

const TopBar = () => {
  return (
    <div className="container mx-auto px-3 sm:px-5">
      <div
        className="
          flex
          items-center
          justify-between
          gap-2
          py-3
          sm:gap-4
          sm:py-4
          md:py-5
        "
      >
        {/* ================================================= */}
        {/* شماره تماس */}
        {/* ================================================= */}

        <div
          className="
            flex
            min-w-0
            shrink
            items-center
            gap-1.5
            font-semibold
            text-white
            sm:gap-2
          "
        >
          <FiPhone size={18} className="shrink-0 sm:h-5 sm:w-5" />

          <span
            className="
              whitespace-nowrap
              text-[11px]
              sm:text-sm
              md:text-base
            "
          >
            09106386819
          </span>
        </div>

        {/* ================================================= */}
        {/* لوگو */}
        {/* ================================================= */}

        <Link to="/" aria-label="صفحه اصلی" className="shrink-0">
          <img
            src="/images/icon.png"
            alt="لوگوی فروشگاه کاظمی"
            className="
              w-11
              object-contain
              sm:w-14
              md:w-16
            "
          />
        </Link>

        {/* ================================================= */}
        {/* فروشگاه */}
        {/* ================================================= */}

        <Link
          to="/"
          className="
            flex
            min-w-0
            shrink
            items-center
            gap-1.5
            whitespace-nowrap
            font-bold
            text-white
            sm:gap-2
          "
        >
          <FaHome size={21} className="shrink-0 sm:h-6 sm:w-6 md:h-7 md:w-7" />

          <span
            className="
              text-[13px]
              sm:text-base
              md:text-[20px]
            "
          >
            فروشگاه الماس
          </span>
        </Link>
      </div>
    </div>
  );
};

export default TopBar;
