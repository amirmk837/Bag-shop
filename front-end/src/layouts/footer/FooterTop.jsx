import { useEffect, useState } from "react";
import { FiPhone } from "react-icons/fi";
import { FaInstagram, FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import { useSiteSettings } from "../../context/useSiteSettings";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const SOCIAL_META = {
  INSTAGRAM: { label: "اینستاگرام", Icon: FaInstagram, color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" },
  TELEGRAM: { label: "تلگرام", Icon: FaTelegramPlane, color: "bg-sky-500" },
  WHATSAPP: { label: "واتساپ", Icon: FaWhatsapp, color: "bg-green-600" },
  BALE: { label: "بله", color: "bg-blue-600", mark: "ب" },
  RUBIKA: { label: "روبیکا", color: "bg-purple-600", mark: "R" },
};

const SocialIcon = ({ platform }) => {
  const item = SOCIAL_META[platform] || { label: platform, color: "bg-zinc-700", mark: "↗" };

  if (item.Icon) {
    const Icon = item.Icon;
    return (
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${item.color}`}>
        <Icon size={23} />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black text-white ${item.color}`}>
      {item.mark}
    </span>
  );
};

const FooterTop = () => {
  const [socialLinks, setSocialLinks] = useState([]);
  const { siteSettings: site } = useSiteSettings();

  useEffect(() => {
    const controller = new AbortController();

    const loadSocialLinks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/social-links`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("دریافت لینک‌های شبکه‌های اجتماعی ناموفق بود.");

        const result = await response.json();
        const links = Array.isArray(result.data) ? result.data : [];

        setSocialLinks(
          links
            .filter((item) => item.isActive !== false && typeof item.url === "string" && item.url.trim() !== "")
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        );
      } catch (error) {
        if (error.name !== "AbortError") console.error("Social links:", error);
      }
    };

    loadSocialLinks();
    return () => controller.abort();
  }, []);

  return (
    <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <a
        href="/"
        aria-label={`صفحه اصلی ${site?.storeName || "فروشگاه کاظمی"}`}
        className="group flex items-center justify-center gap-3 sm:justify-start"
      >
        <img
          src={site?.footerLogoUrl ? `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}${site.footerLogoUrl}` : "/images/icon.png"}
          alt={`لوگوی ${site?.storeName || "فروشگاه کاظمی"}`}
          className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-14"
        />
        <div>
          <p className="text-lg font-black text-white sm:text-xl">{site?.storeName || "فروشگاه کاظمی"}</p>
          <p className="mt-1 text-xs text-zinc-400">{site?.headerText || "همراه انتخاب بهتر شما"}</p>
        </div>
      </a>

      <div className="flex justify-center">
        <a
          href={site?.phone ? `tel:${site.phone.replace(/[^0-9+]/g, "")}` : undefined}
          dir="rtl"
          className="group flex w-full max-w-xs items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
            <FiPhone size={21} />
          </span>
          <span>
            <span className="block text-xs text-zinc-400">تماس با ما</span>
            <span dir="ltr" className="mt-1 block text-base font-bold text-white">
              {site?.phone || "شماره تماس ثبت نشده"}
            </span>
          </span>
        </a>
      </div>

      <div aria-label="شبکه‌های اجتماعی فروشگاه" className="flex flex-wrap items-center justify-center gap-3 sm:col-span-2 lg:col-span-1 lg:justify-end">
        {socialLinks.map((item) => {
          const label = item.label || item.platform;
          return (
            <a
              key={item.platform}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.channelName?.trim() || label}
              title={item.channelName?.trim() || label}
              className="rounded-xl transition duration-300 hover:-translate-y-1 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <span className="flex flex-col items-center gap-1"><SocialIcon platform={item.platform} /><span className="max-w-24 truncate text-[11px] text-zinc-400">{item.channelName?.trim() || label}</span></span>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default FooterTop;
