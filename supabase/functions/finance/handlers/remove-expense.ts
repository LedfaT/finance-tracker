import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

import { getFinanceState, removeExpense } from "../repository.ts";
import type { FinanceContext } from "../types.ts";

export const handleRemoveExpense = async (
  supabase: SupabaseClient,
  context: FinanceContext
) => {
  if (!context.body.expenseId) {
    throw new Error("expense_id_missing");
  }

  await removeExpense(supabase, context.userId, context.body.expenseId);

  return getFinanceState(supabase, context.userId, context.periodMonth);
};
