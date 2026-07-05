import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

import { getFinanceState, saveIncome } from "../repository.ts";
import type { FinanceContext } from "../types.ts";

export const handleSaveIncome = async (
  supabase: SupabaseClient,
  context: FinanceContext
) => {
  const amount = Number(context.body.amount);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("invalid_income_amount");
  }

  await saveIncome(supabase, context.userId, context.periodMonth, amount);

  return getFinanceState(supabase, context.userId, context.periodMonth);
};
