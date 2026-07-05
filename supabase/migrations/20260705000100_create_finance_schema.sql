create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create extension if not exists pg_cron with schema extensions;
exception
  when others then
    raise notice 'pg_cron extension is not available in this environment: %', sqlerrm;
end $$;

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  username text,
  first_name text not null default '',
  last_name text,
  language_code text,
  photo_url text,
  is_premium boolean not null default false,
  allows_write_to_pm boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  monthly_report_enabled boolean not null default true,
  report_timezone text not null default 'Europe/Kyiv',
  locale text not null default 'ru' check (locale in ('ru', 'uk', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  period_month date not null,
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  currency text not null default 'UAH',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint income_entries_period_month_check check (
    period_month = date_trunc('month', period_month)::date
  ),
  constraint income_entries_user_month_key unique (user_id, period_month)
);

create table public.tax_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  period_month date not null,
  tax_mode text not null default 'fop3' check (tax_mode in ('fop2', 'fop3', 'manual')),
  tax_percent numeric(7, 4) not null default 5 check (tax_percent >= 0 and tax_percent <= 100),
  fixed_tax numeric(14, 2) not null default 1760 check (fixed_tax >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tax_settings_period_month_check check (
    period_month = date_trunc('month', period_month)::date
  ),
  constraint tax_settings_user_month_key unique (user_id, period_month)
);

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  color text not null default '#2aabee',
  sort_order integer not null default 0,
  system_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_categories_user_name_key unique (user_id, name)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  category_id uuid references public.expense_categories(id) on delete set null,
  category_name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  spent_on date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  report_month date not null,
  income_amount numeric(14, 2) not null default 0,
  tax_amount numeric(14, 2) not null default 0,
  expenses_amount numeric(14, 2) not null default 0,
  balance_amount numeric(14, 2) not null default 0,
  category_breakdown jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_reports_report_month_check check (
    report_month = date_trunc('month', report_month)::date
  ),
  constraint monthly_reports_user_month_key unique (user_id, report_month)
);

create index income_entries_user_period_idx on public.income_entries(user_id, period_month desc);
create index tax_settings_user_period_idx on public.tax_settings(user_id, period_month desc);
create index expenses_user_spent_on_idx on public.expenses(user_id, spent_on desc);
create index expenses_user_category_idx on public.expenses(user_id, category_name);
create index monthly_reports_user_month_idx on public.monthly_reports(user_id, report_month desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_users_set_updated_at
  before update on public.app_users
  for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

create trigger income_entries_set_updated_at
  before update on public.income_entries
  for each row execute function public.set_updated_at();

create trigger tax_settings_set_updated_at
  before update on public.tax_settings
  for each row execute function public.set_updated_at();

create trigger expense_categories_set_updated_at
  before update on public.expense_categories
  for each row execute function public.set_updated_at();

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

create trigger monthly_reports_set_updated_at
  before update on public.monthly_reports
  for each row execute function public.set_updated_at();

create or replace function public.bootstrap_app_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.expense_categories (user_id, name, color, sort_order, system_key)
  values
    (new.id, 'Жилье', '#2aabee', 10, 'housing'),
    (new.id, 'Еда', '#22c55e', 20, 'food'),
    (new.id, 'Транспорт', '#eab308', 30, 'transport'),
    (new.id, 'Сервисы', '#ef4444', 40, 'services'),
    (new.id, 'Здоровье', '#8b5cf6', 50, 'health'),
    (new.id, 'Другое', '#64748b', 60, 'other')
  on conflict (user_id, name) do nothing;

  return new;
end;
$$;

create trigger app_users_bootstrap
  after insert on public.app_users
  for each row execute function public.bootstrap_app_user();

create or replace function public.generate_monthly_reports(
  p_report_month date default date_trunc('month', current_date - interval '1 month')::date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_month date := date_trunc('month', p_report_month)::date;
  affected_count integer := 0;
begin
  insert into public.monthly_reports (
    user_id,
    report_month,
    income_amount,
    tax_amount,
    expenses_amount,
    balance_amount,
    category_breakdown,
    generated_at
  )
  select
    users.id,
    normalized_month,
    coalesce(income.amount, 0),
    round(
      coalesce(income.amount, 0) * (coalesce(taxes.tax_percent, 0) / 100)
        + coalesce(taxes.fixed_tax, 0),
      2
    ),
    coalesce(expense_totals.total_amount, 0),
    coalesce(income.amount, 0)
      - round(
        coalesce(income.amount, 0) * (coalesce(taxes.tax_percent, 0) / 100)
          + coalesce(taxes.fixed_tax, 0),
        2
      )
      - coalesce(expense_totals.total_amount, 0),
    coalesce(category_totals.breakdown, '[]'::jsonb),
    now()
  from public.app_users as users
  inner join public.user_settings as settings
    on settings.user_id = users.id
    and settings.monthly_report_enabled = true
  left join public.income_entries as income
    on income.user_id = users.id
    and income.period_month = normalized_month
  left join public.tax_settings as taxes
    on taxes.user_id = users.id
    and taxes.period_month = normalized_month
  left join lateral (
    select coalesce(sum(expenses.amount), 0) as total_amount
    from public.expenses
    where expenses.user_id = users.id
      and expenses.spent_on >= normalized_month
      and expenses.spent_on < normalized_month + interval '1 month'
  ) as expense_totals on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'category', grouped.category_name,
        'amount', grouped.total_amount
      )
      order by grouped.total_amount desc
    ) as breakdown
    from (
      select expenses.category_name, sum(expenses.amount) as total_amount
      from public.expenses
      where expenses.user_id = users.id
        and expenses.spent_on >= normalized_month
        and expenses.spent_on < normalized_month + interval '1 month'
      group by expenses.category_name
    ) as grouped
  ) as category_totals on true
  on conflict (user_id, report_month) do update set
    income_amount = excluded.income_amount,
    tax_amount = excluded.tax_amount,
    expenses_amount = excluded.expenses_amount,
    balance_amount = excluded.balance_amount,
    category_breakdown = excluded.category_breakdown,
    generated_at = now(),
    updated_at = now();

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

alter table public.app_users enable row level security;
alter table public.user_settings enable row level security;
alter table public.income_entries enable row level security;
alter table public.tax_settings enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.monthly_reports enable row level security;

revoke all on public.app_users from anon, authenticated;
revoke all on public.user_settings from anon, authenticated;
revoke all on public.income_entries from anon, authenticated;
revoke all on public.tax_settings from anon, authenticated;
revoke all on public.expense_categories from anon, authenticated;
revoke all on public.expenses from anon, authenticated;
revoke all on public.monthly_reports from anon, authenticated;

do $$
begin
  if to_regnamespace('cron') is not null then
    begin
      execute 'select cron.unschedule($1)' using 'generate-monthly-finance-reports';
    exception
      when others then
        null;
    end;

    execute 'select cron.schedule($1, $2, $3)'
      using
        'generate-monthly-finance-reports',
        '0 9 1 * *',
        'select public.generate_monthly_reports();';
  else
    raise notice 'cron schema is not available; monthly report cron was not scheduled';
  end if;
end $$;
