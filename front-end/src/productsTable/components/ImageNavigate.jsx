import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const ImageNavigation = ({ onPrev, onNext, position = "card" }) => {
  // =================================================
  // Modal
  // =================================================

  if (position === "modal") {
    return (
      <>
        {/* عکس قبلی */}
        <button
          type="button"
          onClick={onNext}
          aria-label="عکس قبلی"
          className="
            absolute
            right-3
            top-1/2
            z-50
            hidden
            h-10
            w-10
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            bg-white/10
            text-white
            backdrop-blur
            transition
            hover:bg-white/20
            sm:flex
            sm:right-5
            sm:h-12
            sm:w-12
            md:right-6
            md:h-14
            md:w-14
          "
        >
          <FiChevronRight className="h-6 w-6 sm:h-7 sm:w-7 md:h-[30px] md:w-[30px]" />
        </button>

        {/* عکس بعدی */}
        <button
          type="button"
          onClick={onPrev}
          aria-label="عکس بعدی"
          className="
            absolute
            left-3
            top-1/2
            z-50
            hidden
            h-10
            w-10
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            bg-white/10
            text-white
            backdrop-blur
            transition
            hover:bg-white/20
            sm:flex
            sm:left-5
            sm:h-12
            sm:w-12
            md:left-6
            md:h-14
            md:w-14
          "
        >
          <FiChevronLeft className="h-6 w-6 sm:h-7 sm:w-7 md:h-[30px] md:w-[30px]" />
        </button>
      </>
    );
  }

  // =================================================
  // Card
  // موبایل: بدون فلش
  // دسکتاپ: فلش
  // =================================================

  return (
    <>
      {/* عکس قبلی */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onNext(e);
        }}
        aria-label="عکس قبلی"
        className="
          absolute
          right-2
          top-1/2
          z-10
          hidden
          h-8
          w-8
          -translate-y-1/2
          items-center
          justify-center
          rounded-full
          bg-black/50
          text-white
          backdrop-blur
          transition
          hover:bg-black/80
          sm:flex
          sm:right-3
          sm:h-9
          sm:w-9
        "
      >
        <FiChevronRight className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
      </button>

      {/* عکس بعدی */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPrev(e);
        }}
        aria-label="عکس بعدی"
        className="
          absolute
          left-2
          top-1/2
          z-10
          hidden
          h-8
          w-8
          -translate-y-1/2
          items-center
          justify-center
          rounded-full
          bg-black/50
          text-white
          backdrop-blur
          transition
          hover:bg-black/80
          sm:flex
          sm:left-3
          sm:h-9
          sm:w-9
        "
      >
        <FiChevronLeft className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
      </button>
    </>
  );
};

export default ImageNavigation;
