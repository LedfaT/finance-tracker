import type {
  AppSettings,
  FinanceState,
  Locale,
  TaxMode,
} from "../types/finance";
import { getSupabaseClient } from "./supabase";

interface FinanceApiResponse {
  error?: string;
  finance?: FinanceState;
  ok: boolean;
  settings?: AppSettings;
}

interface FinancePayload {
  action:
    | "add_expense"
    | "get_state"
    | "remove_expense"
    | "save_income"
    | "save_tax"
    | "update_settings";
  amount?: number;
  category?: string;
  expenseId?: string;
  fixedTax?: number;
  initData: string;
  locale?: Locale;
  monthlyReportEnabled?: boolean;
  note?: string;
  spentOn?: string;
  taxMode?: TaxMode;
  taxPercent?: number;
}

export const callFinanceApi = async (payload: FinancePayload) => {
  const { data, error } =
    await getSupabaseClient().functions.invoke<FinanceApiResponse>("finance", {
      body: payload,
    });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.ok) {
    throw new Error(data?.error ?? "finance_api_failed");
  }

  return data;
};
