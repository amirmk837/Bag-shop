const Banner = () => {
  return (
    <div className="w-full px-3 sm:px-5 md:px-6">
      <img
        src="/images/banners/banner.webp"
        alt="بنر فروشگاه"
        className="
          mx-auto
          block
          h-auto
          w-full
          rounded-2xl
          object-cover
          sm:rounded-3xl
          lg:rounded-4xl
        "
      />
    </div>
  );
};

export default Banner;
