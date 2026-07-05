export interface TelegramUser {
  allows_write_to_pm?: boolean;
  first_name: string;
  id: number;
  is_premium?: boolean;
  language_code?: string;
  last_name?: string;
  photo_url?: string;
  username?: string;
}

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

export const verifyTelegramInitData = async (
  initData: string,
  botToken: string
) => {
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

export const parseTelegramUser = (initData: string) => {
  const rawUser = new URLSearchParams(initData).get("user");

  if (!rawUser) {
    return;
  }

  return JSON.parse(rawUser) as TelegramUser;
};
