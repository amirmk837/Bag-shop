const ImageThumbnails = ({
  images,
  activeImage,
  onSelect,
  position = "bottom-2",
  w = "w-12",
  h = "h-8",
}) => {
  if (!Array.isArray(images) || images.length <= 1) {
    return null;
  }

  return (
    <div
      className={`
        theme-thumbnail-rail absolute left-1/2 ${position} z-30
        flex max-w-[calc(100%-16px)]
        -translate-x-1/2
        items-center justify-center gap-1
        overflow-x-auto overflow-y-hidden
        rounded-xl p-1
        scrollbar-none
        sm:gap-1.5 sm:rounded-2xl sm:p-1.5
      `}
    >
      {images.map((image, index) => {
        const isActive = activeImage === index;

        return (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSelect(index, event);
            }}
            aria-label={`نمایش تصویر ${index + 1}`}
            aria-pressed={isActive}
            className={`
              theme-thumbnail-button ${isActive ? "is-active" : ""}
              ${w} ${h}
              relative flex shrink-0 cursor-pointer
              overflow-hidden rounded-lg border
              transition-[border-color,opacity,box-shadow,transform] duration-200 ease-out
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-cyan-500
              focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
              ${isActive ? "opacity-100" : "opacity-75 hover:opacity-100"}
            `}
          >
            <img
              src={image}
              alt=""
              loading="lazy"
              decoding="async"
              draggable="false"
              className="
                h-full w-full select-none
                object-contain
                transition-transform duration-300
                hover:scale-105
              "
            />
          </button>
        );
      })}
    </div>
  );
};

export default ImageThumbnails;
