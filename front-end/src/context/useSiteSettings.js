import { useContext } from "react";
import { SiteSettingsContext } from "./siteSettingsContextValue";

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error("useSiteSettings باید داخل SiteSettingsProvider استفاده شود.");
  }

  return context;
};
