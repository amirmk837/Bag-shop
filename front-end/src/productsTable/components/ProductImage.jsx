import { useRef } from "react";

const ProductImage = ({
  image,
  title,
  id,
  onNext,
  onPrev,
  onClick,
  loading = "lazy",
  fetchPriority = "auto",
}) => {
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (event) => {
    touchEndX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null || touchEndX.current === null) {
      touchStartX.current = null;
      touchEndX.current = null;
      return;
    }

    const distance = touchStartX.current - touchEndX.current;

    if (Math.abs(distance) >= 50) {
      event.preventDefault();
      event.stopPropagation();

      if (distance < 0) {
        onNext?.();
      } else {
        onPrev?.();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <img
      src={image}
      alt={title || id || "تصویر محصول"}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      draggable="false"
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="
        relative z-0
        h-full w-full cursor-pointer
        select-none object-contain
        p-4 sm:p-5
        touch-pan-y
        drop-shadow-[0_8px_14px_rgba(0,0,0,0.2)]
        transition-all duration-700 ease-out
        group-hover:scale-[1.045]
        group-hover:drop-shadow-[0_12px_22px_rgba(34,211,238,0.16)]
        active:scale-[0.98]
      "
    />
  );
};

export default ProductImage;
