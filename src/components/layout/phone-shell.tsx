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

export const PhoneShell = ({
  activeScreen,
  children,
  locale,
  onLocaleChange,
  onOpenScreen,
  platformLabel,
}: PhoneShellProps) => (
  <main className="app-shell">
    <section className="phone-template" aria-label="Finance Bot">
      <header className="chat-header">
        <div className="bot-mark" aria-hidden="true">
          ₴
        </div>
        <div>
          <p>{t(locale, "appTitle")}</p>
          <h1>
            {t(
              locale,
              navItems.find((item) => item.id === activeScreen)?.labelKey ??
                "navAuth"
            )}
          </h1>
        </div>
        <div className="header-tools">
          <span>{platformLabel}</span>
          <select
            aria-label={t(locale, "language")}
            onChange={(event) => onLocaleChange(event.target.value as Locale)}
            value={locale}
          >
            <option value="ru">RU</option>
            <option value="uk">UA</option>
            <option value="en">EN</option>
          </select>
        </div>
      </header>

      <section className="screen-body">{children}</section>

      <nav className="bottom-nav" aria-label="Разделы приложения">
        {navItems.map((item) => (
          <button
            data-active={activeScreen === item.id}
            key={item.id}
            onClick={() => onOpenScreen(item.id)}
            type="button"
          >
            {t(locale, item.labelKey)}
          </button>
        ))}
      </nav>
    </section>
  </main>
);
