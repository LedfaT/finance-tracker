import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

import { getFinanceState, updateSettings } from "../repository.ts";
import type { FinanceContext } from "../types.ts";

export const handleUpdateSettings = async (
  supabase: SupabaseClient,
  context: FinanceContext
) => {
  const { locale } = context.body;

  if (locale && locale !== "ru" && locale !== "uk" && locale !== "en") {
    throw new Error("invalid_locale");
  }

  await updateSettings(supabase, context.userId, {
    locale,
    monthlyReportEnabled: context.body.monthlyReportEnabled,
  });

  return getFinanceState(supabase, context.userId, context.periodMonth);
};
