import { useEffect, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const resolveImageUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url}`;
};

export default function FooterTrustBadges() {
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch(`${API_URL}/footer-trust-badges`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("دریافت نمادهای اعتماد ناموفق بود.");
        }

        const result = await response.json();

        setBadges(
          Array.isArray(result.data)
            ? result.data.filter(
                (item) =>
                  item.isActive !== false &&
                  typeof item.imageUrl === "string" &&
                  item.imageUrl.trim(),
              )
            : [],
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Footer trust badges:", error);
        }
      }
    };

    load();

    return () => controller.abort();
  }, []);

  if (!badges.length) return null;

  return (
    <div
      aria-label="مجوزها و نمادهای اعتماد فروشگاه"
      className="mt-8 flex flex-wrap items-center justify-center gap-5"
    >
      {badges.map((badge) => {
        const image = (
          <img
            src={resolveImageUrl(badge.imageUrl)}
            alt={badge.altText}
            title={badge.title}
            loading="lazy"
            className="h-20 max-w-32 object-contain"
          />
        );

        return badge.linkUrl ? (
          <a
            key={badge.id}
            href={badge.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={badge.title}
            className="rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {image}
          </a>
        ) : (
          <div key={badge.id}>{image}</div>
        );
      })}
    </div>
  );
}
