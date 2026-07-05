export type AuthStatus =
  | "authenticated"
  | "checking"
  | "config_missing"
  | "error"
  | "waiting_telegram";

export type ScreenId = "auth" | "expenses" | "income" | "reports" | "taxes";

export type TaxMode = "fop2" | "fop3" | "manual";

export type Locale = "en" | "ru" | "uk";

export interface Expense {
  amount: number;
  category: string;
  date: string;
  id: string;
  note: string;
}

export interface ExpenseDraft {
  amount: string;
  category: string;
  date: string;
  note: string;
}

export interface FinanceState {
  expenses: Expense[];
  fixedTax: number;
  income: number;
  taxMode: TaxMode;
  taxPercent: number;
}

export interface AppSettings {
  locale: Locale;
  monthlyReportEnabled: boolean;
  reportTimezone: string;
}

export interface TaxPreset {
  fixedTax: number;
  id: TaxMode;
  label: string;
  percent: number;
}

export interface MonthSummary {
  expenses: number;
  income: number;
  label: string;
}
