import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

import { getFinanceState, saveTax } from "../repository.ts";
import type { FinanceContext } from "../types.ts";

export const handleSaveTax = async (
  supabase: SupabaseClient,
  context: FinanceContext
) => {
  const fixedTax = Number(context.body.fixedTax);
  const taxPercent = Number(context.body.taxPercent);
  const { taxMode } = context.body;

  if (taxMode !== "fop2" && taxMode !== "fop3" && taxMode !== "manual") {
    throw new Error("invalid_tax_mode");
  }

  if (
    !Number.isFinite(fixedTax) ||
    !Number.isFinite(taxPercent) ||
    fixedTax < 0 ||
    taxPercent < 0 ||
    taxPercent > 100
  ) {
    throw new Error("invalid_tax_values");
  }

  await saveTax(supabase, context.userId, context.periodMonth, {
    fixedTax,
    taxMode,
    taxPercent,
  });

  return getFinanceState(supabase, context.userId, context.periodMonth);
};
