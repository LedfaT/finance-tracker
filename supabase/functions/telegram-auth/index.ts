import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  parseTelegramUser,
  verifyTelegramInitData,
} from "../_shared/telegram.ts";

interface TelegramAuthRequest {
  initData?: string;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed", ok: false }, 405);
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

  if (!botToken) {
    return jsonResponse(
      { error: "telegram_bot_token_missing", ok: false },
      500
    );
  }

  const body = (await request.json()) as TelegramAuthRequest;

  if (!body.initData) {
    return jsonResponse({ error: "init_data_missing", ok: false }, 400);
  }

  const isValid = await verifyTelegramInitData(body.initData, botToken);

  if (!isValid) {
    return jsonResponse({ error: "init_data_invalid", ok: false }, 401);
  }

  return jsonResponse({
    ok: true,
    user: parseTelegramUser(body.initData),
  });
});
