import { useRef } from "react";

const ProductImage = ({ image, title, id, onNext, onPrev, onClick, loading = "lazy", fetchPriority = "auto" }) => {
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
        h-full w-full cursor-pointer
        select-none object-contain p-4
        touch-pan-y
        transition-transform duration-700
        group-hover:scale-105
      "
    />
  );
};

export default ProductImage;
