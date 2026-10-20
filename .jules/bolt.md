## 2026-09-29 - Unbounded catalog typeahead

**Learning:** `searchProducts` is a leading-wildcard `ILIKE` with no limit, and the sales screen calls it on every debounced keystroke. On the development catalog a 2-character query (`co`) matches 2,629 of 3,332 active products. Postgres finishes that scan in about 3ms; the cost is shipping and rendering every row. Collapsing `getFrequentProducts` into one join only saves ~0.2ms of SQL plus a round trip, because those queries are already ~1ms warm. The Neon pool is also `max: 1`, so `Promise.all` does not overlap queries — but raising the pool to parallelize cheap reads is the wrong fix.

**Action:** Measure match counts before rewriting small queries. Cap interactive catalog search. Leave the full match set for callers that need it. Do not raise the pool size just to overlap sub-millisecond queries.
