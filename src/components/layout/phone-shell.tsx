import type { ReactNode } from "react";

import { t } from "../../lib/i18n";
import type { Locale, ScreenId } from "../../types/finance";
import { navItems } from "./nav";

interface PhoneShellProps {
  activeScreen: ScreenId;
  children: ReactNode;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onOpenScreen: (screenId: ScreenId) => void;
  platformLabel: string;
}

const navIcons: Record<ScreenId, ReactNode> = {
  auth: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.8 19c.9-3.4 3-5.1 6.2-5.1s5.3 1.7 6.2 5.1" />
    </>
  ),
  expenses: (
    <>
      <path d="M6.8 6.5h10.4" />
      <path d="M7.8 11.5h8.4" />
      <path d="M8.8 16.5h6.4" />
      <path d="M5.8 3.8h12.4v16.4H5.8z" />
    </>
  ),
  income: (
    <>
      <path d="M5 16.8h14" />
      <path d="M7.2 14.2v-3.6" />
      <path d="M12 14.2V7.2" />
      <path d="M16.8 14.2V9.4" />
    </>
  ),
  reports: (
    <>
      <path d="M5.5 18.5V5.5h13" />
      <path d="M8.3 14.7 11 12l2.2 1.8 4.1-5" />
    </>
  ),
  taxes: (
    <>
      <path d="M7.2 16.8 16.8 7.2" />
      <circle cx="8" cy="8" r="1.8" />
      <circle cx="16" cy="16" r="1.8" />
    </>
  ),
};

export const PhoneShell = ({
  activeScreen,
  children,
  locale,
  onLocaleChange,
  onOpenScreen,
  platformLabel,
}: PhoneShellProps) => {
  const activeItem = navItems.find((item) => item.id === activeScreen);
  const activeLabel = t(locale, activeItem?.labelKey ?? "navAuth");

  return (
    <main className="app-shell">
      <section className="phone-template" aria-label="Finance Bot">
        <header className="app-header">
          <div className="brand-lockup">
            <div className="bot-mark" aria-hidden="true">
              ₴
            </div>
            <div className="brand-copy">
              <p>{t(locale, "appTitle")}</p>
              <h1>{activeLabel}</h1>
            </div>
          </div>

          <div className="header-tools">
            <span className="platform-pill">{platformLabel}</span>
            <label className="language-control">
              <span className="visually-hidden">{t(locale, "language")}</span>
              <select
                aria-label={t(locale, "language")}
                onChange={(event) =>
                  onLocaleChange(event.target.value as Locale)
                }
                value={locale}
              >
                <option value="ru">RU</option>
                <option value="uk">UA</option>
                <option value="en">EN</option>
              </select>
            </label>
          </div>
        </header>

        <section className="screen-body">{children}</section>

        <nav className="bottom-nav" aria-label="Разделы приложения">
          {navItems.map((item) => {
            const label = t(locale, item.labelKey);

            return (
              <button
                aria-label={label}
                data-active={activeScreen === item.id}
                key={item.id}
                onClick={() => onOpenScreen(item.id)}
                type="button"
              >
                <span className="nav-icon" aria-hidden="true">
                  <svg focusable="false" viewBox="0 0 24 24">
                    {navIcons[item.id]}
                  </svg>
                </span>
                <span className="nav-label">{label}</span>
              </button>
            );
          })}
        </nav>
      </section>
    </main>
  );
};
