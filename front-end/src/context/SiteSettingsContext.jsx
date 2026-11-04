import { createContext, useContext, useEffect, useState } from "react";
import { getSiteSettings } from "../services/siteSettingsApi";

const SiteSettingsContext = createContext(null);

export const SiteSettingsProvider = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSiteSettings = async () => {
    try {
      const data = await getSiteSettings();
      setSiteSettings(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSiteSettings().catch((error) => {
      console.error("Site settings:", error);
    });
  }, []);

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
