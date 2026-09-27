const ImageThumbnails = ({
  images,
  activeImage,
  onSelect,
  position = "bottom-2",
  w = "w-12",
  h = "h-8",
}) => {
  if (images.length <= 1) {
    return null;
  }

  return (
    <div
      className={`
        absolute
        left-1/2
        ${position}
        z-30
        flex
        max-w-[calc(100%-16px)]
        -translate-x-1/2
        items-center
        justify-center
        gap-1
        overflow-x-auto
        overflow-y-hidden
        rounded-xl
        bg-black/60
        p-1
        backdrop-blur-md
        scrollbar-none
        sm:gap-1.5
        sm:rounded-2xl
        sm:p-1.5
      `}
    >
      {images.map((image, index) => (
        <button
          key={`${image}-${index}`}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(index, e);
          }}
          className={`
            ${w}
            ${h}
            flex
            shrink-0
            cursor-pointer
            overflow-hidden
            rounded-lg
            border
            bg-zinc-900
            transition-all
            duration-200
            ${
              activeImage === index
                ? "scale-105 border-white opacity-100"
                : "border-transparent opacity-60 hover:opacity-100"
            }
          `}
        >
          <img
            src={image}
            alt=""
            className="
              h-full
              w-full
              object-contain
            "
          />
        </button>
      ))}
    </div>
  );
};

export default ImageThumbnails;
