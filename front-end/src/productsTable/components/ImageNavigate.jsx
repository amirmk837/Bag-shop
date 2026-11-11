import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const ImageNavigation = ({ onPrev, onNext, position = "card" }) => {
  const isModal = position === "modal";

  const buttonClass = isModal
    ? `
      absolute top-1/2 z-50 hidden -translate-y-1/2
      items-center justify-center rounded-full
      border border-white/15
      bg-[#071426]/65 text-cyan-50
      shadow-[0_8px_25px_rgba(0,0,0,0.3)]
      backdrop-blur-xl
      transition-all duration-300 ease-out
      hover:scale-110 hover:border-cyan-300/50
      hover:bg-[#0b2940]/90
      hover:text-cyan-200
      hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]
      active:scale-95
      focus-visible:outline-none
      focus-visible:ring-2 focus-visible:ring-cyan-400
      focus-visible:ring-offset-2
      focus-visible:ring-offset-[#071426]
      sm:flex
      h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14
    `
    : `
      absolute top-1/2 z-10 hidden -translate-y-1/2
      items-center justify-center rounded-full
      border border-white/15
      bg-[#071426]/75 text-cyan-50
      shadow-[0_5px_18px_rgba(0,0,0,0.3)]
      backdrop-blur-lg
      transition-all duration-300 ease-out
      hover:scale-110 hover:border-cyan-300/50
      hover:bg-[#0b2940]/95
      hover:text-cyan-200
      hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]
      active:scale-95
      focus-visible:outline-none
      focus-visible:ring-2 focus-visible:ring-cyan-400
      focus-visible:ring-offset-2
      focus-visible:ring-offset-[#071426]
      sm:flex
      h-8 w-8 sm:h-9 sm:w-9
    `;

  const stopCardNavigation = (event, callback) => {
    if (!isModal) {
      event.preventDefault();
      event.stopPropagation();
    }

    callback?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={(event) => stopCardNavigation(event, onPrev)}
        aria-label="عکس قبلی"
        className={`theme-dark-overlay ${buttonClass} right-2 ${
          isModal ? "sm:right-5 md:right-6" : "sm:right-3"
        }`}
      >
        <FiChevronRight className="h-5 w-5 sm:h-6 sm:w-6 md:h-[30px] md:w-[30px]" />
      </button>

      <button
        type="button"
        onClick={(event) => stopCardNavigation(event, onNext)}
        aria-label="عکس بعدی"
        className={`theme-dark-overlay ${buttonClass} left-2 ${
          isModal ? "sm:left-5 md:left-6" : "sm:left-3"
        }`}
      >
        <FiChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 md:h-[30px] md:w-[30px]" />
      </button>
    </>
  );
};

export default ImageNavigation;
