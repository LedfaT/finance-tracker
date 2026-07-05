import type { AppSettings } from "../types/finance";

const storageKey = "finance-mini-app-settings";

export const defaultAppSettings: AppSettings = {
  locale: "ru",
  monthlyReportEnabled: true,
  reportTimezone: "Europe/Kyiv",
};

export const getStoredSettings = () => {
  try {
    const rawSettings = localStorage.getItem(storageKey);

    if (!rawSettings) {
      return defaultAppSettings;
    }

    return {
      ...defaultAppSettings,
      ...(JSON.parse(rawSettings) as Partial<AppSettings>),
    };
  } catch {
    return defaultAppSettings;
  }
};

export const storeSettings = (settings: AppSettings) => {
  localStorage.setItem(storageKey, JSON.stringify(settings));
};
