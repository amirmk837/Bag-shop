import { useEffect, useState } from "react";

const useImageViewer = (images = []) => {
  const [activeImage, setActiveImage] = useState(0);
  const [isImageOpen, setIsImageOpen] = useState(false);

  // =========================================
  // بستن عکس
  // =========================================

  const closeImage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsImageOpen(false);

    if (window.history.state?.imageOpen) {
      window.history.back();
    }
  };

  // =========================================
  // کنترل Back مرورگر
  // =========================================

  useEffect(() => {
    const handlePopState = () => {
      setIsImageOpen(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // =========================================
  // عکس بعدی
  // =========================================

  const nextImage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!images.length) return;

    setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // =========================================
  // عکس قبلی
  // =========================================

  const prevImage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!images.length) return;

    setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // =========================================
  // انتخاب Thumbnail
  // =========================================

  const handleThumbnailClick = (index, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setActiveImage(index);

    if (!isImageOpen) {
      setIsImageOpen(true);

      window.history.pushState({ imageOpen: true }, "");
    }
  };

  return {
    activeImage,
    isImageOpen,
    setActiveImage,
    setIsImageOpen,
    closeImage,
    nextImage,
    prevImage,
    handleThumbnailClick,
  };
};

export default useImageViewer;
