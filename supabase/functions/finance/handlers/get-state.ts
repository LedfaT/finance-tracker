import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

import { getFinanceState } from "../repository.ts";
import type { FinanceContext } from "../types.ts";

export const handleGetState = (
  supabase: SupabaseClient,
  context: FinanceContext
) => getFinanceState(supabase, context.userId, context.periodMonth);
