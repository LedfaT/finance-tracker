import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

import type { TelegramUser } from "../_shared/telegram.ts";

interface ExpenseRow {
  amount: number | string;
  category_name: string;
  id: string;
  note: string;
  spent_on: string;
}

interface IncomeRow {
  amount: number | string;
}

interface TaxRow {
  fixed_tax: number | string;
  tax_mode: "fop2" | "fop3" | "manual";
  tax_percent: number | string;
}

interface SettingsRow {
  locale: "en" | "ru" | "uk";
  monthly_report_enabled: boolean;
  report_timezone: string;
}

const defaultSettings = {
  locale: "ru",
  monthlyReportEnabled: true,
  reportTimezone: "Europe/Kyiv",
};

const toNumber = (value: number | string | null | undefined) =>
  Number(value ?? 0);

export const normalizeMonth = (periodMonth?: string) => {
  const source = periodMonth ? new Date(periodMonth) : new Date();

  return new Date(source.getFullYear(), source.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
};

export const upsertTelegramUser = async (
  supabase: SupabaseClient,
  telegramUser: TelegramUser
) => {
  const { data, error } = await supabase
    .from("app_users")
    .upsert(
      {
        allows_write_to_pm: telegramUser.allows_write_to_pm ?? false,
        first_name: telegramUser.first_name,
        is_premium: telegramUser.is_premium ?? false,
        language_code: telegramUser.language_code,
        last_name: telegramUser.last_name,
        last_seen_at: new Date().toISOString(),
        photo_url: telegramUser.photo_url,
        telegram_id: telegramUser.id,
        username: telegramUser.username,
      },
      { onConflict: "telegram_id" }
    )
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
};

const nextMonth = (periodMonth: string) => {
  const source = new Date(periodMonth);

  return new Date(source.getFullYear(), source.getMonth() + 1, 1)
    .toISOString()
    .slice(0, 10);
};

export const getFinanceState = async (
  supabase: SupabaseClient,
  userId: string,
  periodMonth: string
) => {
  const [incomeResult, taxResult, expensesResult, settingsResult] =
    await Promise.all([
      supabase
        .from("income_entries")
        .select("amount")
        .eq("user_id", userId)
        .eq("period_month", periodMonth)
        .maybeSingle<IncomeRow>(),
      supabase
        .from("tax_settings")
        .select("tax_mode,tax_percent,fixed_tax")
        .eq("user_id", userId)
        .eq("period_month", periodMonth)
        .maybeSingle<TaxRow>(),
      supabase
        .from("expenses")
        .select("id,amount,category_name,spent_on,note")
        .eq("user_id", userId)
        .gte("spent_on", periodMonth)
        .lt("spent_on", nextMonth(periodMonth))
        .order("spent_on", { ascending: false })
        .order("created_at", { ascending: false })
        .returns<ExpenseRow[]>(),
      supabase
        .from("user_settings")
        .select("monthly_report_enabled,report_timezone,locale")
        .eq("user_id", userId)
        .maybeSingle<SettingsRow>(),
    ]);

  for (const result of [
    incomeResult,
    taxResult,
    expensesResult,
    settingsResult,
  ]) {
    if (result.error) {
      throw result.error;
    }
  }

  const income = incomeResult.data;
  const tax = taxResult.data;

  return {
    finance: {
      expenses: (expensesResult.data ?? []).map((expense) => ({
        amount: toNumber(expense.amount),
        category: expense.category_name,
        date: expense.spent_on,
        id: expense.id,
        note: expense.note,
      })),
      fixedTax: toNumber(tax?.fixed_tax ?? 1760),
      income: toNumber(income?.amount),
      taxMode: tax?.tax_mode ?? "fop3",
      taxPercent: toNumber(tax?.tax_percent ?? 5),
    },
    settings: settingsResult.data
      ? {
          locale: settingsResult.data.locale,
          monthlyReportEnabled: settingsResult.data.monthly_report_enabled,
          reportTimezone: settingsResult.data.report_timezone,
        }
      : defaultSettings,
  };
};

export const saveIncome = async (
  supabase: SupabaseClient,
  userId: string,
  periodMonth: string,
  amount: number
) => {
  const { error } = await supabase.from("income_entries").upsert(
    {
      amount,
      period_month: periodMonth,
      user_id: userId,
    },
    { onConflict: "user_id,period_month" }
  );

  if (error) {
    throw error;
  }
};

export const saveTax = async (
  supabase: SupabaseClient,
  userId: string,
  periodMonth: string,
  tax: {
    fixedTax: number;
    taxMode: "fop2" | "fop3" | "manual";
    taxPercent: number;
  }
) => {
  const { error } = await supabase.from("tax_settings").upsert(
    {
      fixed_tax: tax.fixedTax,
      period_month: periodMonth,
      tax_mode: tax.taxMode,
      tax_percent: tax.taxPercent,
      user_id: userId,
    },
    { onConflict: "user_id,period_month" }
  );

  if (error) {
    throw error;
  }
};

export const addExpense = async (
  supabase: SupabaseClient,
  userId: string,
  expense: {
    amount: number;
    category: string;
    note: string;
    spentOn: string;
  }
) => {
  const { error } = await supabase.from("expenses").insert({
    amount: expense.amount,
    category_name: expense.category,
    note: expense.note,
    spent_on: expense.spentOn,
    user_id: userId,
  });

  if (error) {
    throw error;
  }
};

export const removeExpense = async (
  supabase: SupabaseClient,
  userId: string,
  expenseId: string
) => {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
};

export const updateSettings = async (
  supabase: SupabaseClient,
  userId: string,
  settings: {
    locale?: "en" | "ru" | "uk";
    monthlyReportEnabled?: boolean;
  }
) => {
  const { error } = await supabase
    .from("user_settings")
    .update({
      locale: settings.locale,
      monthly_report_enabled: settings.monthlyReportEnabled,
    })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
};
