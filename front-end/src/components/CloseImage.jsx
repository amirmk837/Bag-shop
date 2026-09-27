import { FiX } from "react-icons/fi";

const CloseImage = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      type="button"
      aria-label="بستن تصویر"
      className="
        absolute
        right-3
        top-3
        z-50
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-full
        bg-white/10
        text-white
        backdrop-blur
        transition
        hover:bg-white/20
        sm:right-5
        sm:top-5
        sm:h-11
        sm:w-11
        md:right-6
        md:top-6
        md:h-12
        md:w-12
      "
    >
      <FiX className="h-6 w-6 sm:h-7 sm:w-7" />
    </button>
  );
};

export default CloseImage;
