import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import {
  parseTelegramUser,
  verifyTelegramInitData,
} from "../_shared/telegram.ts";
import { handleAddExpense } from "./handlers/add-expense.ts";
import { handleGetState } from "./handlers/get-state.ts";
import { handleRemoveExpense } from "./handlers/remove-expense.ts";
import { handleSaveIncome } from "./handlers/save-income.ts";
import { handleSaveTax } from "./handlers/save-tax.ts";
import { handleUpdateSettings } from "./handlers/update-settings.ts";
import { normalizeMonth, upsertTelegramUser } from "./repository.ts";
import type { FinanceContext, FinanceRequest } from "./types.ts";

const handlers = {
  add_expense: handleAddExpense,
  get_state: handleGetState,
  remove_expense: handleRemoveExpense,
  save_income: handleSaveIncome,
  save_tax: handleSaveTax,
  update_settings: handleUpdateSettings,
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", ok: false }, 405);
  }

  try {
    const body = (await request.json()) as FinanceRequest;
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (!botToken) {
      return jsonResponse(
        { error: "telegram_bot_token_missing", ok: false },
        500
      );
    }

    if (!body.initData) {
      return jsonResponse({ error: "init_data_missing", ok: false }, 400);
    }

    const isValid = await verifyTelegramInitData(body.initData, botToken);

    if (!isValid) {
      return jsonResponse({ error: "init_data_invalid", ok: false }, 401);
    }

    const telegramUser = parseTelegramUser(body.initData);

    if (!telegramUser) {
      return jsonResponse({ error: "telegram_user_missing", ok: false }, 400);
    }

    const action = body.action ?? "get_state";
    const handler = handlers[action];

    if (!handler) {
      return jsonResponse({ error: "unknown_action", ok: false }, 400);
    }

    const supabase = createServiceClient();
    const userId = await upsertTelegramUser(supabase, telegramUser);
    const context: FinanceContext = {
      body,
      periodMonth: normalizeMonth(body.periodMonth),
      telegramUser,
      userId,
    };
    const result = await handler(supabase, context);

    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "finance_request_failed",
        ok: false,
      },
      500
    );
  }
});
