# React + TypeScript + Vite

Starter project with Vite, React, TypeScript, Ultracite, Husky, pnpm, and local Supabase.

## Scripts

```bash
pnpm dev
pnpm build
pnpm check
pnpm fix
```

## Telegram Bot App

This project is prepared as a Telegram Mini App. The frontend reads Telegram launch data from `window.Telegram.WebApp`, and Supabase Edge Functions verify `initData` with `TELEGRAM_BOT_TOKEN` on the server.

- `telegram-auth` verifies the Telegram session.
- `finance` verifies the Telegram session, upserts the app user, and reads/writes finance data.

Set frontend env:

```bash
cp .env.local.example .env.local
```

Set local function env:

```bash
cp supabase/.env.example supabase/.env
```

Put only public values in `.env.local`. Keep `TELEGRAM_BOT_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` only in `supabase/.env` locally or Supabase project secrets in production.

## Supabase Local

Start the local Supabase stack:

```bash
pnpm supabase:start
```

Useful local endpoints after startup:

- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- Database: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Create `.env.local` from [.env.local.example](./.env.local.example) and set `VITE_SUPABASE_ANON_KEY` from `pnpm supabase:status`. Do not put the service-role key in Vite environment variables.

Create `supabase/.env` from [supabase/.env.example](./supabase/.env.example) and set:

- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Apply migrations locally with:

```bash
pnpm supabase:db:reset
```

Serve local Edge Functions with:

```bash
pnpm supabase:functions:serve
```

The database schema includes `app_users`, income entries, tax settings, expense categories, expenses, user settings, monthly reports, `updated_at` triggers, user bootstrap triggers, and a monthly report generator scheduled through `pg_cron` when the extension is available.

Other Supabase commands:

```bash
pnpm supabase:status
pnpm supabase:db:reset
pnpm supabase:functions:serve
pnpm supabase:types
pnpm supabase:stop
```

## Needed From You

- Telegram bot username from BotFather, without `@`, for `VITE_TELEGRAM_BOT_USERNAME`.
- Telegram bot token from BotFather, stored locally in `supabase/.env` as `TELEGRAM_BOT_TOKEN`.
- Public HTTPS URL for the deployed Mini App. Telegram will not use a plain local HTTP URL in production.
- The first bot flow: what the Mini App should do after opening, and what payload the bot should receive from `sendData`.
- Supabase project ref when you are ready to deploy functions and store production secrets.

# finance-tracker
