import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { getSiteSettings } from "../services/siteSettingsApi";

const SiteSettingsContext = createContext(null);

export const SiteSettingsProvider = ({ children }) => {
  const location = useLocation();
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const refreshSiteSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSiteSettings();
      setSiteSettings(data);
      return data;
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  // پنل مدیریت Header فروشگاه را نمایش نمی‌دهد؛ تنظیمات ظاهری آنجا
  // فقط در صفحه مربوط به خودش دریافت می‌شود.
  useEffect(() => {
    if (location.pathname.startsWith("/admin") || hasLoaded || loading) return;

    refreshSiteSettings().catch((error) => {
      console.error("Site settings:", error);
    });
  }, [location.pathname, hasLoaded, loading, refreshSiteSettings]);

  return (
    <SiteSettingsContext.Provider
      value={{ siteSettings, loading, refreshSiteSettings }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error("useSiteSettings باید داخل SiteSettingsProvider استفاده شود.");
  }

  return context;
};
