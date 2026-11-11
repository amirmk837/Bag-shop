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
        theme-dark-overlay absolute left-1/2 ${position} z-30
        flex max-w-[calc(100%-16px)]
        -translate-x-1/2
        items-center justify-center gap-1
        overflow-x-auto overflow-y-hidden
        rounded-xl border border-white/10
        bg-[#07101f]/80 p-1
        shadow-[0_8px_25px_rgba(0,0,0,0.3)]
        backdrop-blur-xl scrollbar-none
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
              ${w} ${h}
              relative flex shrink-0 cursor-pointer
              overflow-hidden rounded-lg border
              bg-gradient-to-br from-[#172b45] to-[#0b1424]
              transition-all duration-300 ease-out
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-cyan-400
              ${
                isActive
                  ? "scale-105 border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)] opacity-100"
                  : "border-white/10 opacity-60 hover:border-cyan-400/40 hover:opacity-100"
              }
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
                hover:scale-110
              "
            />
          </button>
        );
      })}
    </div>
  );
};

export default ImageThumbnails;
