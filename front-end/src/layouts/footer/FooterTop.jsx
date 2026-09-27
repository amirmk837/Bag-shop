import { FiInstagram, FiSend, FiMail, FiPhone } from "react-icons/fi";

const contacts = [
  {
    icon: FiPhone,
    title: "شماره تماس:",
    value: "02143000017 داخلی 2",
  },
  {
    icon: FiMail,
    title: "ایمیل:",
    value: "info@baninopc.com",
  },
];

const socials = [{ icon: FiInstagram }, { icon: FiSend }];

const FooterTop = () => {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        gap-8
        rounded-lg
        px-2
        py-6
        text-white
        sm:px-4
        md:px-6
        lg:flex-row
        lg:justify-between
        lg:gap-6
        lg:px-10
      "
    >
      {/* ================================================= */}
      {/* لوگو */}
      {/* ================================================= */}

      <img
        src="/images/icon.png"
        alt="لوگوی فروشگاه"
        className="
          h-12
          w-auto
          object-contain
          sm:h-14
        "
      />

      {/* ================================================= */}
      {/* اطلاعات تماس */}
      {/* ================================================= */}

      <div
        className="
          flex
          w-full
          flex-col
          items-center
          justify-center
          gap-6
          sm:flex-row
          sm:gap-10
          lg:w-auto
          lg:gap-8
        "
      >
        {contacts.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="
                flex
                w-full
                items-center
                justify-center
                gap-3
                sm:w-auto
                sm:justify-start
                sm:gap-4
              "
            >
              <Icon className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />

              <div className="text-right">
                <p className="text-xs text-zinc-300 sm:text-sm">{item.title}</p>

                <p className="text-sm font-semibold sm:text-base">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================================= */}
      {/* شبکه‌های اجتماعی */}
      {/* ================================================= */}

      <div className="flex items-center gap-5 text-2xl sm:gap-6 sm:text-3xl">
        {socials.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={index}
              type="button"
              className="
                transition-transform
                duration-300
                hover:scale-110
              "
            >
              <Icon />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FooterTop;
