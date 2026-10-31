import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const ImageNavigation = ({ onPrev, onNext, position = "card" }) => {
  const isModal = position === "modal";

  const buttonClass = isModal
    ? `
      absolute top-1/2 z-50 hidden -translate-y-1/2
      items-center justify-center rounded-full
      bg-white/10 text-white backdrop-blur
      transition hover:bg-white/20 sm:flex
      h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14
    `
    : `
      absolute top-1/2 z-10 hidden -translate-y-1/2
      items-center justify-center rounded-full
      bg-black/50 text-white backdrop-blur
      transition hover:bg-black/80 sm:flex
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
        className={`${buttonClass} right-2 ${
          isModal ? "sm:right-5 md:right-6" : "sm:right-3"
        }`}
      >
        <FiChevronRight className="h-5 w-5 sm:h-6 sm:w-6 md:h-[30px] md:w-[30px]" />
      </button>

      <button
        type="button"
        onClick={(event) => stopCardNavigation(event, onNext)}
        aria-label="عکس بعدی"
        className={`${buttonClass} left-2 ${
          isModal ? "sm:left-5 md:left-6" : "sm:left-3"
        }`}
      >
        <FiChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 md:h-[30px] md:w-[30px]" />
      </button>
    </>
  );
};

export default ImageNavigation;
