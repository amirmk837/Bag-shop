const FooterAbout = () => {
  return (
    <section
      aria-labelledby="footer-about-title"
      className="
        border-t border-white/10 pt-7
        sm:pt-8
      "
    >
      <div className="max-w-3xl">
        <h2
          id="footer-about-title"
          className="
            mb-3 text-lg font-bold text-white
            sm:text-xl
          "
        >
          درباره فروشگاه الماس
        </h2>

        <p className="text-justify text-sm leading-8 text-zinc-400 sm:text-base sm:leading-9">
          در فروشگاه الماس می‌توانید محصولات مرتبط با کیف، کوله‌پشتی و لوازم
          جانبی را مشاهده و بررسی کنید. هدف ما فراهم کردن تجربه‌ای ساده و راحت
          برای مشاهده محصولات و انتخاب کالای موردنظر شماست.
        </p>
      </div>
    </section>
  );
};

export default FooterAbout;
