import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./app.css";
import { useTelegramWebApp } from "./hooks/use-telegram-web-app";
import { hasSupabaseConfig } from "./lib/supabase";
import { verifyTelegramSession } from "./lib/telegram-auth";

type AuthStatus =
  | "authenticated"
  | "checking"
  | "config_missing"
  | "error"
  | "waiting_telegram";

const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

const statusCopy: Record<AuthStatus, { label: string; title: string }> = {
  authenticated: {
    label: "Доступ открыт",
    title: "Telegram подтвержден",
  },
  checking: {
    label: "Проверка",
    title: "Проверяем Telegram-сессию",
  },
  config_missing: {
    label: "Нужна настройка",
    title: "Supabase еще не подключен",
  },
  error: {
    label: "Ошибка входа",
    title: "Не удалось подтвердить вход",
  },
  waiting_telegram: {
    label: "Ожидание Telegram",
    title: "Открой приложение через бота",
  },
};

const nextSteps = [
  "Доход за месяц",
  "Налоговый режим",
  "Категории расходов",
  "Первый отчет",
];

const App = () => {
  const { isTelegram, platform, user, webApp } = useTelegramWebApp();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("waiting_telegram");
  const [authError, setAuthError] = useState<string>();
  const autoCheckStarted = useRef(false);

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ")
    : "Гость";

  const botLink = botUsername ? `https://t.me/${botUsername}` : undefined;
  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .map((part) => part.at(0))
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [displayName]
  );

  const checkSession = useCallback(async () => {
    setAuthError(undefined);

    if (!isTelegram) {
      setAuthStatus("waiting_telegram");
      return;
    }

    if (!hasSupabaseConfig) {
      setAuthStatus("config_missing");
      return;
    }

    setAuthStatus("checking");
    webApp?.HapticFeedback?.impactOccurred("light");

    const result = await verifyTelegramSession();

    if (result?.ok) {
      setAuthStatus("authenticated");
      webApp?.HapticFeedback?.notificationOccurred("success");
      return;
    }

    setAuthStatus("error");
    setAuthError(result?.error ?? "unknown_auth_error");
    webApp?.HapticFeedback?.notificationOccurred("error");
  }, [isTelegram, webApp]);

  useEffect(() => {
    if (!isTelegram) {
      setAuthStatus("waiting_telegram");
      return;
    }

    if (autoCheckStarted.current) {
      return;
    }

    autoCheckStarted.current = true;
    void checkSession();
  }, [checkSession, isTelegram]);

  const copy = statusCopy[authStatus];
  const isBusy = authStatus === "checking";
  const isAuthenticated = authStatus === "authenticated";
  const authStateDescription =
    authError ??
    (isAuthenticated
      ? "Можно переходить к настройке профиля"
      : "Данные не сохраняются, пока вход не подтвержден");
  let primaryActionLabel = "Войти через Telegram";

  if (isBusy) {
    primaryActionLabel = "Проверяем...";
  }

  if (isAuthenticated) {
    primaryActionLabel = "Продолжить";
  }

  return (
    <main className="auth-shell">
      <section className="phone-template" aria-labelledby="auth-title">
        <header className="chat-header">
          <div className="bot-mark" aria-hidden="true">
            ₴
          </div>
          <div>
            <p>Finance Bot</p>
            <h1 id="auth-title">Вход</h1>
          </div>
          <span>{isTelegram ? platform : "browser"}</span>
        </header>

        <section className="chat-thread" aria-live="polite">
          <div className="message message--bot">
            <span>{copy.label}</span>
            <strong>{copy.title}</strong>
            <p>
              {authStatus === "waiting_telegram"
                ? "Авторизация работает через защищенные данные запуска Telegram Mini App."
                : "После входа откроем настройку дохода и налогов отдельным шагом."}
            </p>
          </div>

          <div className="auth-card">
            <div className="user-row">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="" />
              ) : (
                <div className="avatar">{initials}</div>
              )}
              <div>
                <strong>{displayName}</strong>
                <span>
                  {user?.username ? `@${user.username}` : "Telegram user"}
                </span>
              </div>
            </div>

            <div className="auth-state" data-status={authStatus}>
              <i aria-hidden="true" />
              <div>
                <strong>{copy.title}</strong>
                <span>{authStateDescription}</span>
              </div>
            </div>

            <button
              className="primary-action"
              disabled={isBusy}
              onClick={checkSession}
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
                Открыть бота
              </a>
            ) : null}
          </div>

          <div className="message message--user">
            <strong>Дальше не все на одном экране</strong>
            <p>
              Каждый блок будет отдельным шагом: доход, налоги, расходы, отчеты.
            </p>
          </div>
        </section>

        <section className="step-list" aria-label="Следующие экраны">
          {nextSteps.map((step, index) => (
            <div
              className="step-item"
              data-active={index === 0 && isAuthenticated}
              key={step}
            >
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </section>

        <nav className="bottom-nav" aria-label="Разделы приложения">
          <button type="button">Вход</button>
          <button disabled type="button">
            Доход
          </button>
          <button disabled type="button">
            Расходы
          </button>
          <button disabled type="button">
            Отчеты
          </button>
        </nav>
      </section>
    </main>
  );
};

export default App;
