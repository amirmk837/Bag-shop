const PicBox = ({ images, activeImage, product }) => {
  return (
    <button
      type="button"
      className="
        h-full
        w-full
      "
    >
      <img
        src={images[activeImage]}
        alt={product.title || product.id}
        className="
          h-full
          w-full
          object-contain
          p-3
          transition-transform
          duration-700
          group-hover:scale-105
          sm:p-4
        "
      />
    </button>
  );
};

export default PicBox;
