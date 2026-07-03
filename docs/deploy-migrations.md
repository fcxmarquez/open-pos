# Deploy-Time Database Migrations

Last updated: 2026-07-02

## How it works

`vercel.json` sets `buildCommand` to `bun run db:migrate:deploy && bun run build`. `db:migrate:deploy` runs `drizzle-kit migrate` using whichever `DATABASE_URL` Vercel already injects for that deployment's environment — no `.env.local`, no manual step.

- **Preview deploys** migrate the Preview Neon branch. A broken migration fails the PR's own preview build, visible on the PR before merge.
- **Production deploys** migrate the Production Neon branch. A broken migration fails the build, the deployment never goes live, and the previous (working) deployment keeps serving traffic.
- Because migration runs on *every* deploy, a migration that's stuck failing blocks *all* future deploys — not just the one that introduced it — until someone fixes it. That's what makes a stuck migration impossible to ignore for long.

This replaced a GitHub Actions workflow (`release-production.yml`) that ran `drizzle-kit migrate` against production separately, after merge, decoupled from the actual Vercel deploy. That decoupling was the flaw: the workflow could fail forever without blocking anything, and it did — it failed on every run for about 4 months (2026-03-17 through 2026-07-02) with nobody noticing, because a failed side-workflow doesn't stop the app from deploying.

## The remaining risk: old code, new schema

Running migrate before build closes the "code shipped, schema wasn't" gap, but it doesn't make deploys instantaneous. There's a short window — the rest of the build, plus however long it takes Vercel to switch traffic to the new deployment — where the schema has *already* changed but the *old* code is still live and serving requests.

That's harmless for additive changes. It's not harmless if a migration adds a `NOT NULL` column with no default in the same deploy that starts requiring it. Concretely, this repo's own migration `0007_glorious_wolfpack.sql` (the cart discount columns) does this:

```sql
ALTER TABLE "sales" ADD COLUMN "subtotal" numeric(10, 2);
-- ... other columns ...
UPDATE "sales" SET "subtotal" = "total" WHERE "subtotal" IS NULL;
ALTER TABLE "sales" ALTER COLUMN "subtotal" SET NOT NULL;
```

By the time this migration finishes, `subtotal` is `NOT NULL` with no default. If the *old* checkout code (the version still live while the rest of the build finishes) tried to insert a sale during that window, its `INSERT` — written before `subtotal` existed — omits the column entirely, and Postgres rejects it: `null value in column "subtotal" violates not-null constraint`. Same failure class as the original outage, just a much smaller window (seconds to low tens of seconds, instead of months).

For this app the odds of a real sale landing in that exact window are low, but not zero — a POS can get hit by a checkout at any time, including mid-deploy.

## The rule: expand before you contract

When a migration needs a column that the old code doesn't know how to fill in:

1. **Expand first, safe to ship anytime:**
   - Nullable column, no default — old code omitting it is fine.
   - Or `NOT NULL` **with** a default — Postgres fills it in for any `INSERT` that doesn't mention the column, so old code is still fine.
   - Never `NOT NULL` with no default in the same migration that ships alongside code that only *sometimes* supplies it.
2. Ship the new code that reads/writes the column.
3. **Contract later, as its own migration:** once you're confident the old code is no longer running anywhere (true almost immediately here, since Vercel does one atomic deployment swap rather than a gradual rollout — but still a separate step), tighten to `NOT NULL` without a default, drop old columns, etc.

`0007` would have been zero-risk split as: add `subtotal` nullable → backfill → ship the discount feature → in a later migration, `SET NOT NULL`. The single-migration version isn't wrong for a low-traffic solo project, just worth knowing the tradeoff before reaching for `NOT NULL` without a default on a table that's actively written to.
