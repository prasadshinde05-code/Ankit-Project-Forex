# FX Capital Partners — Investment Portal

A real, deployable client-facing investment app: public proposal intake,
manager onboarding with real email invites, live (non-compounding) balance
tracking, and image-only transaction proof for investors.

**Stack:** Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage).
Deploys to Vercel's free tier + Supabase's free tier — no server to manage.

This has been built and production-built (`npm run build`) successfully with
**zero** `npm audit` vulnerabilities as of writing. Re-run `npm audit` and
`npm outdated` before you go live — dependency patches ship constantly, and
freezing versions is never "done" for a real app.

---

## What's actually secure here (and what isn't)

**Real:**
- Every table uses Postgres Row Level Security — an investor's Supabase
  session can only ever read their own rows, enforced by the database itself,
  not by application code.
- Investors never touch the `transactions` table — they read
  `investor_transactions`, a view with no `amount` column at all. This isn't
  hidden in the UI; the data is architecturally absent from what an investor's
  query can return.
- Investors get real accounts (email + Supabase-managed password), created via
  a genuine email invite — not a shared 4-digit PIN.
- Transaction proof images live in a **private** Storage bucket; nobody gets
  a URL to an image they're not authorized to see (enforced by Storage RLS
  policies, same mechanism as the tables).
- The audit log is append-only from the app's perspective: only server code
  holding the service-role key can write to it; nobody can insert, edit, or
  delete an entry through the API, including managers.

**Not yet done — treat as a checklist, not a finished state:**
- No rate limiting on the public `/request` form or `/login` — add this
  (Vercel has a built-in option, or use Supabase's own rate limits) before
  sharing the link publicly, or expect spam submissions and brute-force
  login attempts.
- No email verification step is enforced beyond Supabase's defaults — review
  Supabase Auth settings (Dashboard → Authentication → Providers) for your
  risk tolerance.
- Only one investment per investor is assumed (`/portal` takes the most
  recent one). Extend this if a client will ever have multiple concurrent
  investments.
- No automated backups configured — Supabase's paid tiers include point-in-
  time recovery; the free tier does not. Decide what you're comfortable with
  before real client money is represented here.
- No tests. For something handling other people's money, add at minimum
  integration tests around the RLS policies (Supabase provides a way to test
  policies directly in SQL) before trusting it fully.

---

## 1. Create the Supabase project

1. Go to supabase.com → New project. Pick a region close to your users.
2. Once it's ready: **SQL Editor → New query** → paste the entire contents
   of `supabase/schema.sql` → Run. This creates every table, policy, and view.
3. **Storage → New bucket** → name it exactly `transaction-proofs` → set it
   to **Private**. (The storage policies in schema.sql already reference this
   bucket name and were applied when you ran the SQL above — create the
   bucket with this exact name for them to take effect.)
4. **Settings → API** → copy the Project URL, the `anon` public key, and the
   `service_role` key (keep this last one secret).

## 2. Create your manager account

Supabase has no concept of "manager" built in — every new signup defaults to
the `investor` role (see `handle_new_user()` in the schema). You promote your
own account manually, once:

1. **Authentication → Users → Add user** (or Invite) → create yourself with
   an email and password.
2. **SQL Editor** → run:
   ```sql
   update profiles set role = 'manager' where email = 'you@yourcompany.com';
   ```
3. Sign in at `/login?as=manager` with that email and password once deployed.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` for local development, or set the same
three variables in Vercel's dashboard (Project → Settings → Environment
Variables) for production:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...       # secret — never expose to the browser
NEXT_PUBLIC_SITE_URL=https://your-deployed-domain.com
```

`NEXT_PUBLIC_SITE_URL` is used to build the link inside investor invite
emails, so it needs to match wherever this is actually deployed.

## 4. Deploy

Easiest path — Vercel:

```bash
npm install -g vercel
vercel login
vercel          # first deploy, follow the prompts
vercel --prod   # promote to production once you're happy
```

Or connect the GitHub repo to Vercel's dashboard for automatic deploys on
push. Either way, set the environment variables from step 3 in Vercel first.

## 5. Test the real flow end-to-end

1. Visit `/request` and submit a test proposal with an email you control.
2. Sign in at `/login?as=manager`, go to Requests, accept it, fill in the
   investment terms — this sends a real invite email via Supabase Auth.
3. Open that email, set a password, and you'll land on `/login?as=investor`.
   Sign in — you should see the live balance and progress bar.
4. Back in the manager view, open that client and add a transaction with an
   image. Refresh the investor portal — the image should appear with no
   amount shown anywhere in that view.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your real Supabase values
npm run dev
```

## Project structure

```
app/
  page.js                 Public landing page
  request/                Public proposal intake form
  login/                  Shared sign-in (redirects by role after auth)
  manager/                Manager dashboard, requests, clients — layout.js guards by role
  portal/                 Investor dashboard — layout.js guards by role
lib/supabase/
  client.js               Browser client (RLS-scoped to the signed-in user)
  server.js                Server Component / Server Action client (same RLS scoping)
  admin.js                Service-role client — server-only, bypasses RLS.
                          Used only for auth invites and audit log writes.
lib/performance.js         Simple (non-compounding) interest calculation
supabase/schema.sql         The entire database: tables, RLS policies, the
                          investor-safe view, storage policies
```

## Extending this

Reasonable next additions, roughly in order of likely need:
- Multiple investments per client (currently assumes one active investment)
- Manager-editable investment terms after onboarding (currently create-only)
- CSV/PDF statements generated server-side for managers (never expose raw
  transaction export to investors, per the design of this app)
- Two-factor auth for manager accounts (Supabase Auth supports this natively)
- A proper design pass — this reuses the proposal deck's navy/gold palette
  but the layouts are functional, not polished
