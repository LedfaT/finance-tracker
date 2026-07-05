interface TelegramAuthRequest {
  initData?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

const encoder = new TextEncoder();

const toHex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const importHmacKey = (key: string | Uint8Array) =>
  crypto.subtle.importKey(
    "raw",
    typeof key === "string" ? encoder.encode(key) : key,
    {
      hash: "SHA-256",
      name: "HMAC",
    },
    false,
    ["sign"]
  );

const sign = async (key: string | Uint8Array, value: string) => {
  const cryptoKey = await importHmacKey(key);

  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
};

const verifyTelegramInitData = async (initData: string, botToken: string) => {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");

  if (!receivedHash) {
    return false;
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .toSorted(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = new Uint8Array(await sign("WebAppData", botToken));
  const calculatedHash = toHex(await sign(secretKey, dataCheckString));

  return calculatedHash === receivedHash;
};

const parseTelegramUser = (initData: string) => {
  const user = new URLSearchParams(initData).get("user");

  if (!user) {
    return null;
  }

  return JSON.parse(user) as unknown;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "method_not_allowed", ok: false },
      { headers: corsHeaders, status: 405 }
    );
  }

  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

  if (!botToken) {
    return Response.json(
      { error: "telegram_bot_token_missing", ok: false },
      { headers: corsHeaders, status: 500 }
    );
  }

  const body = (await request.json()) as TelegramAuthRequest;

  if (!body.initData) {
    return Response.json(
      { error: "init_data_missing", ok: false },
      { headers: corsHeaders, status: 400 }
    );
  }

  const isValid = await verifyTelegramInitData(body.initData, botToken);

  if (!isValid) {
    return Response.json(
      { error: "init_data_invalid", ok: false },
      { headers: corsHeaders, status: 401 }
    );
  }

  return Response.json(
    {
      ok: true,
      user: parseTelegramUser(body.initData),
    },
    { headers: corsHeaders }
  );
});
