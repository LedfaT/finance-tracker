import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

import { addExpense, getFinanceState } from "../repository.ts";
import type { FinanceContext } from "../types.ts";

export const handleAddExpense = async (
  supabase: SupabaseClient,
  context: FinanceContext
) => {
  const amount = Number(context.body.amount);
  const category = context.body.category?.trim();
  const spentOn = context.body.spentOn ?? new Date().toISOString().slice(0, 10);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("invalid_expense_amount");
  }

  if (!category) {
    throw new Error("invalid_expense_category");
  }

  await addExpense(supabase, context.userId, {
    amount,
    category,
    note: context.body.note?.trim() || category,
    spentOn,
  });

  return getFinanceState(supabase, context.userId, context.periodMonth);
};
