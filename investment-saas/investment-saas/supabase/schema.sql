-- ============================================================================
-- FX Capital Partners — investment portal schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ============================================================================

-- ---------- Enum types ----------
create type user_role as enum ('manager', 'investor');
create type request_status as enum ('pending', 'onboarded', 'declined');
create type tx_type as enum ('deposit', 'payout', 'adjustment');

-- ============================================================================
-- PROFILES — one row per auth user. Created automatically on signup.
-- ============================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'investor',
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
grant select, update on profiles to authenticated;

create policy "profiles: self read" on profiles
  for select using (auth.uid() = id);

create policy "profiles: managers read all" on profiles
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
  );

create policy "profiles: self update" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- New auth users default to 'investor'. Promote the first manager manually — see README.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email, 'investor');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- REQUESTS — public proposal intake. Anyone can submit; only managers can read.
-- ============================================================================
create table requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  amount_text text,
  message text,
  status request_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table requests enable row level security;
grant insert on requests to anon, authenticated;
grant select, update on requests to authenticated;

create policy "requests: public insert" on requests
  for insert with check (true);

create policy "requests: managers read" on requests
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
  );

create policy "requests: managers update" on requests
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
  );

-- ============================================================================
-- INVESTMENTS — one active investment per client (extend later for multiple).
-- ============================================================================
create table investments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  principal numeric(14,2) not null,
  monthly_rate numeric(5,2) not null,
  lock_in_months int not null,
  start_date date not null,
  status text not null default 'active',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table investments enable row level security;
grant select, insert, update on investments to authenticated;

create policy "investments: investor reads own" on investments
  for select using (client_id = auth.uid());

create policy "investments: managers read all" on investments
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
  );

create policy "investments: managers write" on investments
  for insert with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
  );

create policy "investments: managers update" on investments
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
  );

-- ============================================================================
-- TRANSACTIONS — full table. Managers only. Investors never get direct access
-- to this table (no policy is defined for them, so RLS denies everything).
-- ============================================================================
create table transactions (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references investments(id) on delete cascade,
  type tx_type not null,
  amount numeric(14,2) not null,
  date date not null,
  note text,
  image_path text not null,           -- path inside the 'transaction-proofs' storage bucket
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table transactions enable row level security;
grant select, insert, update, delete on transactions to authenticated;

create policy "transactions: managers all" on transactions
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
  );

-- ============================================================================
-- INVESTOR-SAFE VIEW — the ONLY way investors ever touch transaction data.
-- No `amount` column exists in this view, so it is not merely hidden by the
-- UI — it is architecturally impossible for an investor's query to return it.
-- The view runs as its owner (bypassing the investor's RLS denial above) but
-- applies its own client_id filter, so each investor only ever sees their own
-- transactions.
-- ============================================================================
create view investor_transactions as
  select t.id, t.investment_id, t.type, t.date, t.image_path, t.created_at
  from transactions t
  join investments i on i.id = t.investment_id
  where i.client_id = auth.uid();

grant select on investor_transactions to authenticated;

-- ============================================================================
-- AUDIT LOG — append-only. Written only by server-side code using the
-- service-role key (bypasses RLS), never by client requests. Managers can
-- read it; nobody can insert, update, or delete it through the API.
-- ============================================================================
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;
grant select on audit_log to authenticated;

create policy "audit: managers read" on audit_log
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
  );
-- Deliberately no insert/update/delete policy for `authenticated` — writes only
-- happen server-side with the service-role key, which bypasses RLS entirely.

-- ============================================================================
-- STORAGE — private bucket for transaction proof screenshots/photos.
-- Run this after creating the bucket named 'transaction-proofs' (private) in
-- Dashboard → Storage → New bucket. Files are stored at: <investment_id>/<file>
-- ============================================================================
create policy "proofs: managers full access"
on storage.objects for all
using (
  bucket_id = 'transaction-proofs' and
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
)
with check (
  bucket_id = 'transaction-proofs' and
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'manager')
);

create policy "proofs: investor reads own"
on storage.objects for select
using (
  bucket_id = 'transaction-proofs' and
  exists (
    select 1 from investments i
    where i.client_id = auth.uid()
    and (storage.foldername(name))[1] = i.id::text
  )
);
