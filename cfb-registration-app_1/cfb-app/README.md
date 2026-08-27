# Church Futsal Brothers — Team Registration

A team registration app: team + church details, manager/assistant manager,
up to 12 players with photos, typed-name declarations, and a photo upload
for the senior pastor's signed & stamped endorsement page.

Data is saved to a free Supabase project (Postgres database + file storage),
and the app itself is hosted free on Vercel.

**Total cost: $0/month** (optionally ~$1/month if you buy a custom domain).

---

## 1. Create your database (Supabase)

1. Go to [supabase.com](https://supabase.com) → sign up free → **New project**.
   Pick any name/region, set a database password (save it somewhere).
2. Once the project is ready, open **SQL Editor** → **New query**.
3. Paste in the entire contents of `schema.sql` (in this folder) and click **Run**.
   This creates the `teams` and `people` tables and a `photos` storage bucket.
4. Go to **Storage** → confirm a `photos` bucket exists and is marked **Public**.
   (The schema script creates this automatically — just double-check it's there.)
5. Go to **Settings → API**. You'll need two values from this page in step 3 below:
   - **Project URL**
   - **anon public** key

## 2. Run it locally first (optional but recommended)

```bash
npm install
cp .env.example .env
```

Open `.env` and paste in your Project URL and anon key from step 1.5.

```bash
npm run dev
```

Open the local URL it prints and try submitting a test team — then check
**Table Editor** in Supabase to confirm the row landed.

## 3. Deploy for free (Vercel)

1. Push this folder to a GitHub repo (or use Vercel's drag-and-drop import
   if you don't want to use git).
2. Go to [vercel.com](https://vercel.com) → sign up free → **Add New → Project**
   → import the repo.
3. Before deploying, open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your Project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon public key
4. Click **Deploy**. You'll get a live URL like `cfb-registration.vercel.app`
   within a minute or two.

That's it — the link is what you share with team managers/players to register.

## 4. Optional: custom domain

In Vercel, go to your project → **Settings → Domains** → add a domain you've
bought (e.g. from Namecheap or Porkbun, ~$10–15/year). Vercel gives you DNS
records to add at your registrar, and handles HTTPS automatically.

## Viewing registrations

The **Rosters** tab in the app reads live from Supabase, so you can check it
from any device. For spreadsheet-style browsing/export, use Supabase's
**Table Editor** directly — it has a built-in CSV export button on the
`teams` and `people` tables.

## Notes on the endorsement / signatures

- Player and manager declarations use a **typed name** as a lightweight
  e-signature — fine for informal consent.
- The **senior pastor's endorsement** (with signature + church stamp) stays
  as a **photo upload of the physical signed page**, since a stamp can't be
  meaningfully replicated online.

## Free tier limits (so you know when you'd ever pay)

- Supabase free tier: 500MB database, 1GB file storage, 5GB bandwidth/month.
  For ~240 registrants with compressed photos, this comfortably fits.
- Vercel free tier: 100GB bandwidth/month — far more than a registration
  site needs.

You'd only outgrow these if the tournament grew dramatically or ran for
years accumulating photos — easy to check usage in each dashboard.
