import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./app.css";
import { PhoneShell } from "./components/layout/phone-shell";
import { AuthScreen } from "./features/auth/auth-screen";
import { ExpensesScreen } from "./features/expenses/expenses-screen";
import { IncomeScreen } from "./features/income/income-screen";
import { ReportsScreen } from "./features/reports/reports-screen";
import { TaxesScreen } from "./features/taxes/taxes-screen";
import { useTelegramWebApp } from "./hooks/use-telegram-web-app";
import {
  calculateNetIncome,
  calculateTaxAmount,
  calculateTotalExpenses,
  categories,
  createExpenseId,
  getExpensesByCategory,
  getMonthlyChart,
  getToday,
} from "./lib/finance";
import { callFinanceApi } from "./lib/finance-api";
import {
  getStoredFinanceState,
  storeFinanceState,
} from "./lib/finance-storage";
import { getStoredSettings, storeSettings } from "./lib/settings-storage";
import { hasSupabaseConfig } from "./lib/supabase";
import { verifyTelegramSession } from "./lib/telegram-auth";
import type {
  AppSettings,
  AuthStatus,
  ExpenseDraft,
  FinanceState,
  Locale,
  ScreenId,
  TaxPreset,
} from "./types/finance";

const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
type RemoteFinancePayload = Omit<
  Parameters<typeof callFinanceApi>[0],
  "initData"
>;

const App = () => {
  const { isTelegram, platform, user, webApp } = useTelegramWebApp();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("waiting_telegram");
  const [authError, setAuthError] = useState<string>();
  const [activeScreen, setActiveScreen] = useState<ScreenId>("auth");
  const [finance, setFinance] = useState<FinanceState>(getStoredFinanceState);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft>({
    amount: "",
    category: categories[0],
    date: getToday(),
    note: "",
  });
  const autoCheckStarted = useRef(false);

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Гость";
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

  const totalExpenses = useMemo(
    () => calculateTotalExpenses(finance.expenses),
    [finance.expenses]
  );
  const taxAmount = calculateTaxAmount(finance);
  const netIncome = calculateNetIncome(finance);
  const balance = netIncome - totalExpenses;
  const expensesByCategory = useMemo(
    () => getExpensesByCategory(finance.expenses),
    [finance.expenses]
  );
  const monthlyChart = useMemo(
    () => getMonthlyChart({ finance, totalExpenses }),
    [finance, totalExpenses]
  );

  useEffect(() => {
    storeFinanceState(finance);
  }, [finance]);

  useEffect(() => {
    storeSettings(settings);
  }, [settings]);

  const applyRemoteState = (response: {
    finance?: FinanceState;
    settings?: AppSettings;
  }) => {
    if (response.finance) {
      setFinance(response.finance);
    }

    if (response.settings) {
      setSettings(response.settings);
    }
  };

  const callRemote = useCallback(
    async (payload: RemoteFinancePayload) => {
      if (!webApp?.initData || !hasSupabaseConfig) {
        return;
      }

      try {
        const response = await callFinanceApi({
          ...payload,
          initData: webApp.initData,
        });

        applyRemoteState(response);
      } catch (error) {
        setAuthError(
          error instanceof Error ? error.message : "finance_sync_failed"
        );
      }
    },
    [webApp?.initData]
  );

  const loadRemoteState = useCallback(async () => {
    await callRemote({ action: "get_state" });
  }, [callRemote]);

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
      await loadRemoteState();
      webApp?.HapticFeedback?.notificationOccurred("success");
      return;
    }

    setAuthStatus("error");
    setAuthError(result?.error ?? "unknown_auth_error");
    webApp?.HapticFeedback?.notificationOccurred("error");
  }, [isTelegram, loadRemoteState, webApp]);

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

  const updateFinance = (patch: Partial<FinanceState>) => {
    setFinance((currentFinance) => ({
      ...currentFinance,
      ...patch,
    }));
  };

  const updateSettings = (patch: Partial<AppSettings>) => {
    const nextSettings = {
      ...settings,
      ...patch,
    };

    setSettings(nextSettings);
    void callRemote({
      action: "update_settings",
      locale: nextSettings.locale,
      monthlyReportEnabled: nextSettings.monthlyReportEnabled,
    });
  };

  const updateLocale = (locale: Locale) => {
    updateSettings({ locale });
  };

  const updateExpenseDraft = (patch: Partial<ExpenseDraft>) => {
    setExpenseDraft((currentDraft) => ({
      ...currentDraft,
      ...patch,
    }));
  };

  const applyTaxPreset = (preset: TaxPreset) => {
    updateFinance({
      fixedTax: preset.fixedTax,
      taxMode: preset.id,
      taxPercent: preset.percent,
    });
  };

  const addExpense = () => {
    const amount = Number(expenseDraft.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      webApp?.HapticFeedback?.notificationOccurred("error");
      return;
    }

    const nextExpense = {
      amount,
      category: expenseDraft.category,
      date: expenseDraft.date,
      id: createExpenseId(),
      note: expenseDraft.note.trim() || expenseDraft.category,
    };

    setFinance((currentFinance) => ({
      ...currentFinance,
      expenses: [nextExpense, ...currentFinance.expenses],
    }));
    updateExpenseDraft({ amount: "", note: "" });
    void callRemote({
      action: "add_expense",
      amount: nextExpense.amount,
      category: nextExpense.category,
      note: nextExpense.note,
      spentOn: nextExpense.date,
    });
    webApp?.HapticFeedback?.notificationOccurred("success");
  };

  const removeExpense = (expenseId: string) => {
    setFinance((currentFinance) => ({
      ...currentFinance,
      expenses: currentFinance.expenses.filter(
        (expense) => expense.id !== expenseId
      ),
    }));
    void callRemote({
      action: "remove_expense",
      expenseId,
    });
  };

  const openScreen = (screenId: ScreenId) => {
    if (screenId !== "auth" && authStatus !== "authenticated") {
      webApp?.HapticFeedback?.notificationOccurred("warning");
      return;
    }

    setActiveScreen(screenId);
    webApp?.HapticFeedback?.selectionChanged();
  };

  const saveIncomeAndOpenTaxes = () => {
    void callRemote({
      action: "save_income",
      amount: finance.income,
    });
    openScreen("taxes");
  };

  const saveTaxAndOpenExpenses = () => {
    void callRemote({
      action: "save_tax",
      fixedTax: finance.fixedTax,
      taxMode: finance.taxMode,
      taxPercent: finance.taxPercent,
    });
    openScreen("expenses");
  };

  const completeAuthStep = () => {
    if (authStatus === "authenticated") {
      openScreen("income");
      return;
    }

    void checkSession();
  };

  return (
    <PhoneShell
      activeScreen={activeScreen}
      locale={settings.locale}
      onLocaleChange={updateLocale}
      onOpenScreen={openScreen}
      platformLabel={isTelegram ? (platform ?? "telegram") : "browser"}
    >
      {activeScreen === "auth" ? (
        <AuthScreen
          authError={authError}
          authStatus={authStatus}
          botLink={botLink}
          displayName={displayName}
          initials={initials}
          isTelegram={isTelegram}
          locale={settings.locale}
          onContinue={completeAuthStep}
          user={user}
        />
      ) : null}

      {activeScreen === "income" ? (
        <IncomeScreen
          finance={finance}
          locale={settings.locale}
          netIncome={netIncome}
          onNext={saveIncomeAndOpenTaxes}
          onUpdateFinance={updateFinance}
          taxAmount={taxAmount}
        />
      ) : null}

      {activeScreen === "taxes" ? (
        <TaxesScreen
          finance={finance}
          locale={settings.locale}
          onApplyPreset={applyTaxPreset}
          onNext={saveTaxAndOpenExpenses}
          onUpdateFinance={updateFinance}
          taxAmount={taxAmount}
        />
      ) : null}

      {activeScreen === "expenses" ? (
        <ExpensesScreen
          expenseDraft={expenseDraft}
          finance={finance}
          locale={settings.locale}
          onAddExpense={addExpense}
          onRemoveExpense={removeExpense}
          onUpdateDraft={updateExpenseDraft}
        />
      ) : null}

      {activeScreen === "reports" ? (
        <ReportsScreen
          balance={balance}
          categorySummary={expensesByCategory}
          income={finance.income}
          locale={settings.locale}
          monthlyChart={monthlyChart}
          onSettingsChange={updateSettings}
          settings={settings}
          taxAmount={taxAmount}
          totalExpenses={totalExpenses}
        />
      ) : null}
    </PhoneShell>
  );
};

export default App;
