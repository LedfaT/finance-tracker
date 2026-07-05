import type { TelegramUser } from "../_shared/telegram.ts";

export type FinanceAction =
  | "add_expense"
  | "get_state"
  | "remove_expense"
  | "save_income"
  | "save_tax"
  | "update_settings";

export interface FinanceRequest {
  action?: FinanceAction;
  amount?: number;
  category?: string;
  expenseId?: string;
  fixedTax?: number;
  initData?: string;
  locale?: "en" | "ru" | "uk";
  monthlyReportEnabled?: boolean;
  note?: string;
  periodMonth?: string;
  spentOn?: string;
  taxMode?: "fop2" | "fop3" | "manual";
  taxPercent?: number;
}

export interface FinanceContext {
  body: FinanceRequest;
  periodMonth: string;
  telegramUser: TelegramUser;
  userId: string;
}
