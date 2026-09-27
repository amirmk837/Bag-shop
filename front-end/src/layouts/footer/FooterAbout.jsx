const FooterAbout = () => {
  return (
    <div
      className="
        flex
        flex-col-reverse
        items-center
        justify-between
        gap-8
        border-t
        border-zinc-500
        pt-8
        text-center
        lg:flex-row
        lg:items-start
        lg:gap-10
        lg:pt-12
        lg:text-right
      "
    >
      {/* متن */}
      <div className="w-full max-w-3xl">
        <h3 className="mb-4 text-xl font-bold text-white sm:text-2xl">
          فروشگاه اینترنتی بانی نو
        </h3>

        <p className="text-justify leading-8 text-zinc-200 sm:leading-9">
          شرکت بانی نو فعالیت خود را از سال ۱۳۷۷ در زمینه فروش قطعات کامپیوتر
          آغاز کرده است.
        </p>
      </div>
    </div>
  );
};

export default FooterAbout;
