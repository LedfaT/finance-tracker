import { getSupabaseClient } from "./supabase";
import { getTelegramWebApp } from "./telegram";

interface TelegramAuthResponse {
  ok: boolean;
  user?: unknown;
  error?: string;
}

export const verifyTelegramSession = async () => {
  const initData = getTelegramWebApp()?.initData;

  if (!initData) {
    return {
      error: "telegram_init_data_missing",
      ok: false,
    } satisfies TelegramAuthResponse;
  }

  try {
    const { data, error } =
      await getSupabaseClient().functions.invoke<TelegramAuthResponse>(
        "telegram-auth",
        {
          body: { initData },
        }
      );

    if (error) {
      return {
        error: error.message,
        ok: false,
      } satisfies TelegramAuthResponse;
    }

    return data;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "auth_request_failed",
      ok: false,
    } satisfies TelegramAuthResponse;
  }
};
