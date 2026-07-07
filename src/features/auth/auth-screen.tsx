import { UserAvatar } from "../../components/user/user-avatar";
import { t } from "../../lib/i18n";
import type { TelegramWebAppUser } from "../../lib/telegram";
import type { AuthStatus, Locale } from "../../types/finance";
import {
  getAuthDescription,
  getAuthTitle,
  getPrimaryActionLabel,
} from "./auth-copy";

interface AuthScreenProps {
  authError?: string;
  authStatus: AuthStatus;
  botLink?: string;
  displayName: string;
  initials: string;
  isTelegram: boolean;
  locale: Locale;
  onContinue: () => void;
  user?: TelegramWebAppUser;
}

export const AuthScreen = ({
  authError,
  authStatus,
  botLink,
  displayName,
  initials,
  isTelegram,
  locale,
  onContinue,
  user,
}: AuthScreenProps) => {
  const isBusy = authStatus === "checking";
  const isAuthenticated = authStatus === "authenticated";
  const title = getAuthTitle(locale, authStatus);
  const authStateDescription = getAuthDescription({
    authError,
    isAuthenticated,
    locale,
  });
  const primaryActionLabel = getPrimaryActionLabel({
    isAuthenticated,
    isBusy,
    locale,
  });

  return (
    <section className="flow-screen auth-screen" aria-live="polite">
      <div className="section-intro">
        <span>{t(locale, "navAuth")}</span>
        <h2>{title}</h2>
        <p>{t(locale, "authDescription")}</p>
      </div>

      <div className="panel auth-card">
        <div className="user-row">
          <UserAvatar initials={initials} user={user} />
          <div>
            <strong>{displayName}</strong>
            <span>
              {user?.username
                ? `@${user.username}`
                : t(locale, "usernameFallback")}
            </span>
          </div>
        </div>

        <div className="auth-state" data-status={authStatus}>
          <i aria-hidden="true" />
          <div>
            <strong>{title}</strong>
            <span>{authStateDescription}</span>
          </div>
        </div>

        <div className="auth-actions">
          <button
            className="primary-action"
            disabled={isBusy}
            onClick={onContinue}
            type="button"
          >
            {primaryActionLabel}
          </button>

          {!isTelegram && botLink ? (
            <a
              className="secondary-action"
              href={botLink}
              rel="noreferrer"
              target="_blank"
            >
              {t(locale, "authOpenBot")}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
};
