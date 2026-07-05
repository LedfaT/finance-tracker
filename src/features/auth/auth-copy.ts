import { t } from "../../lib/i18n";
import type { AuthStatus, Locale } from "../../types/finance";

export const getAuthTitle = (locale: Locale, status: AuthStatus) => {
  if (status === "authenticated") {
    return t(locale, "authTelegramConfirmed");
  }

  if (status === "config_missing") {
    return t(locale, "authMissingConfig");
  }

  if (status === "error") {
    return t(locale, "authError");
  }

  return t(locale, "authWaitingTelegram");
};

export const getAuthDescription = ({
  authError,
  isAuthenticated,
  locale,
}: {
  authError?: string;
  isAuthenticated: boolean;
  locale: Locale;
}) => {
  if (authError) {
    return authError;
  }

  if (isAuthenticated) {
    return t(locale, "nextTaxes");
  }

  return t(locale, "authDescription");
};

export const getPrimaryActionLabel = ({
  isAuthenticated,
  isBusy,
  locale,
}: {
  isAuthenticated: boolean;
  isBusy: boolean;
  locale: Locale;
}) => {
  if (isBusy) {
    return "...";
  }

  if (isAuthenticated) {
    return t(locale, "continue");
  }

  return t(locale, "signInTelegram");
};
