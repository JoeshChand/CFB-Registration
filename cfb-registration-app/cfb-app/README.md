# Church Futsal Brothers — Team Registration

Two pages:

- **`/`** — public registration form. Anyone with the link can submit a
  team. Players, managers, and both senior pastors sign with a real
  draw-to-sign pad (mouse or finger) instead of typing their name.
- **`/admin`** — the roster dashboard. Only reachable by logging in —
  no one else can see submitted teams, photos, or signatures.

Data is saved to a free Supabase project (Postgres database + file
storage), and the app is hosted free on Vercel.

---

## If you're setting this up fresh

Follow `schema.sql` first (creates the tables), **then**
`migration_v2_admin_signatures.sql` (adds signatures + locks the
roster to admins-only). Both go in Supabase → SQL Editor, run one
after the other.

## If you already had the earlier version running

You already have `schema.sql` applied. Just run
`migration_v2_admin_signatures.sql` in Supabase → SQL Editor → New
query. It only adds new columns and changes who can *read* the data —
your existing teams/people rows are untouched.

## Create your admin login

1. In Supabase, go to **Authentication → Users → Add user**.
2. Set an email and password — this is what you'll use to log in at
   `/admin`. It doesn't need to be a real inbox; pick something only
   you know.
3. That's your only admin account. Don't share these credentials —
   anyone who has them can see every registrant's photos and signed
   declarations.

## Deploying / redeploying

Same as before — push to GitHub, import into Vercel, and set these
two environment variables in Vercel (Settings → Environments →
Production):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Both come from Supabase → Settings → API.

**One addition this time:** this project now includes a `vercel.json`
file. It's needed so that visiting `/admin` directly (or refreshing
it) doesn't 404 — Vercel needs to know to hand every route to the
same app. Make sure it's included when you upload/push the project.

## Using it

- Share the base link (e.g. `cfb-app.vercel.app`) with team managers
  for registration.
- Keep the `/admin` link and your login to yourself. That's where you
  see stats, search across all teams, export everything as CSV, or
  print/export a single team's sheet (photos and signatures included,
  ready to save as a PDF via the browser's print dialog).

## About the signatures

- Players, managers, and assistant managers sign with a finger or
  mouse directly in the form.
- Both senior pastors sign the same way, right in the church-details
  section — no more chasing a physical page for their part.
- The photo-upload of a physically signed & stamped page is now
  **optional** — useful if your church wants the physical stamp on
  file too, but no longer required since the pastor can sign
  digitally.

## Free tier limits

- Supabase free tier: 500MB database, 1GB file storage, 5GB
  bandwidth/month — comfortably covers ~240 registrants with photos
  and signatures.
- Vercel free tier: 100GB bandwidth/month.

You'd only approach these limits if the tournament grew a lot or ran
for years accumulating photos — worth a glance at each dashboard's
usage page if registration ever expands significantly.
