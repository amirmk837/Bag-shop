import { useRef } from "react";

const ProductImage = ({ image, title, id, onNext, onPrev }) => {
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchEndX.current === null) {
      return;
    }

    const distance = touchStartX.current - touchEndX.current;

    const minimumSwipe = 50;

    if (Math.abs(distance) >= minimumSwipe) {
      e.preventDefault();
      e.stopPropagation();

      // کشیدن از چپ به راست
      if (distance < 0) {
        onNext?.();
      }

      // کشیدن از راست به چپ
      if (distance > 0) {
        onPrev?.();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <button
      type="button"
      className="
        h-full
        w-full
        cursor-pointer
        touch-pan-y
      "
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={image}
        alt={title || id}
        draggable="false"
        className="
          h-full
          w-full
          select-none
          object-contain
          p-4
          transition-transform
          duration-700
          group-hover:scale-105
        "
      />
    </button>
  );
};

export default ProductImage;
