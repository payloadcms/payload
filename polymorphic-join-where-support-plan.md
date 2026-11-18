Written by AI

# Polymorphic join `where` support — restoration plan

## Background

PR #291 (PYLD-3840) made the drizzle polymorphic-join `where` builder **fail closed**: any
`where` shape it cannot soundly compile across the UNION of the joined target collections now throws
`QueryError: The following path cannot be queried: <path>.<operator>`. This closed a real leak (the
old builder silently dropped all but the first access constraint), but it disabled several `where`
shapes — both caller-supplied (`joins[x][where]`) and, more painfully, access-derived (a single
target collection's `read` rule breaks the join for every request).

The five disabled categories are:

1. Localized fields (`localized: true`, or nested under a localized parent).
2. Fields inside an `array` / `blocks` (separate-row storage).
3. Reaching through a `relationship` / `upload` / `json` field (e.g. `owner.email`, `settings.approved`).
4. The operators `near`, `within`, `intersects`, `all`.
5. A field whose storage shape differs across targets (text vs number; select/radio with differing
   option sets; has-many select vs single select).

The non-polymorphic (single-collection) join path already supports 1–4 because it routes the combined
`where` through `buildQuery` → `parseParams` (`packages/drizzle/src/find/traverseFields.ts`, the
`else` branch at ~L430–590), which emits per-collection `joins` (locale tables, array/blocks value
tables, related tables) and adapter JSON queries. The polymorphic path
(`buildPolymorphicJoinQuery.ts` / `buildPolymorphicJoinWhere.ts`) instead hand-compiles each branch
against **main-table scalar columns only** and UNION-ALLs the branches on a fixed projection
`(id, parent, relationTo, sortPath)`; it cannot express joins/subqueries per branch, and it must also
give NULL semantics to fields that are absent from some branches — which `parseParams` cannot do
(it throws on unknown paths).

## What was restored in this branch

**Category 5 — mixed field shape: partially restored (the select-storage sub-case).**

A path that is a **has-many select** (separate value rows) in one target and a **single select
column** in another — with **identical option values** — is now compiled per branch with its own
storage handler and UNION-ed like any other path. This is the common real-world case where the same
logical `select` field was declared `hasMany` in one collection and not in another.

Files changed:

- `packages/drizzle/src/find/createPolymorphicJoinWherePlan.ts`
  - New plan type `'mixedSelect'`.
  - Tracks an option-value signature for every option field (has-many and single), plus
    `hasScalarSelect` / `hasScalarNonOption`.
  - A path becomes `mixedSelect` (instead of `invalid`) only when **every present target is
    option-based (`select`/`radio`) and all share one option signature**. Any other shape mismatch
    (text vs number, differing option sets, has-many-select mixed with a non-option scalar) stays
    `invalid` / fail-closed.
- `packages/drizzle/src/find/buildPolymorphicJoinWhere.ts`
  - `resolveWherePath` dispatches **per branch** for `mixedSelect`: a branch whose field is
    has-many select resolves through the existing JSON value-table subquery; a branch whose field is
    a single select column (or absent → NULL) falls through to the existing scalar handler. The
    top-level builder still only ever sees `hasManySelect` or `scalar`, so no other logic changed.
- Tests:
  - `createPolymorphicJoinWherePlan.spec.ts`: the old "has-many select mixed with a scalar select →
    invalid" case now asserts `mixedSelect`; added a case proving **differing** option values stay
    `invalid`.
  - `test/joins/int.spec.ts`: the two `rejects.toThrow(...)` mixed-shape tests
    (`useMixedFieldShapeAccessConstraint`, `useNestedMixedFieldShapeAccessConstraint`) are now
    positive filtering assertions. Seed gained top-level `mixedTags` (`['available']` on the article,
    `'not-permitted'` on a note) so the top-level test proves the constraint **includes** the
    authorized article (has-many branch) and **excludes** the unauthorized note (scalar branch).

Why this is safe (no PYLD-3840 regression): every branch applies the full constraint to its own rows
with its own storage handler — nothing is dropped or truncated. Select option values are strings, so
there is no numeric coercion trap (see category 5 below). Unsupported operators on the has-many
branch still throw (`supportedJSONQueryOperators`), i.e. the query fails closed rather than skipping a
branch. Restricting to a single shared option signature keeps the two branches semantically identical.

Test results: `test/joins/int.spec.ts` — **sqlite 114 passed / 7 skipped**, **postgres 121 passed**.
Unit: `packages/drizzle/src/find` — **82 passed**.

## Per-category verdict

### 1. Localized fields — deferred (restorable with significant work)

**Reason unsupported:** the value lives in the collection's `_locales` table
(`<collection>_locales`, keyed by `_parent_id` + `_locale`), not the main table the UNION selects
from. `parseParams`/`getTableColumnFromPath` handle this by adding a `leftJoin` to the locales table;
the polymorphic builder has no per-branch join mechanism.

**Secure plan:** for a localized leaf on a branch, emit a **correlated EXISTS/scalar subquery** to
that branch's locales table instead of a main-table column — the same shape already used for
has-many select (`getHasManySelectExpression`). For an operator `op` on `field` at `locale L`:
`EXISTS (SELECT 1 FROM "<collection>_locales" lt WHERE lt._parent_id = "<table>".id AND lt._locale = L AND <op(lt.<column>, value)>)`.
Reuse `buildOperatorConstraint` for `<op>` so operator handlers/casts match the normal path. `not_*`
and `equals null`/`exists:false` must be expressed as `NOT EXISTS`/absence, not a naive negation
inside `EXISTS`, to preserve NULL semantics. Absent-from-branch → constant per the NULL table below.
Files: `createPolymorphicJoinWherePlan.ts` (new `localized` path type + carry the locales table
name), `buildPolymorphicJoinWhere.ts` (subquery emitter), thread `locale`/`fallbackLocale` through.
Invariants: the correlated `_parent_id` predicate must bind to the branch row (prevents cross-row
leakage); `NOT EXISTS` for negatives prevents the "row with no matching locale silently passes"
fail-open. Tests: `useLocalizedHasManyAccessConstraint` (flip to positive), plus per-locale and
`exists:false`/`not_equals` cases on both adapters.

### 2. Fields inside `array` / `blocks` — deferred (restorable with significant work)

**Reason unsupported:** array/blocks rows live in child tables (`<collection>_<array>`,
`<collection>_blocks_<block>`), reached via `_parent_id`; `pathHasSeparateRows` flags them invalid.

**Secure plan:** identical correlated-subquery approach as localized, but joining the array/blocks
value table (and, for a has-many field **inside** an array — the current `items.tags` fixture — a
second correlated hop to `<collection>_<array>_<field>`). `blocks` additionally needs a `_path` /
block-type predicate so a filter on block A does not match rows of block B. `exists:false` →
`NOT EXISTS`. Files: same two. Invariants: the `_parent_id` chain must be fully correlated at every
hop (a missing hop turns a scoped filter into an unscoped one — a leak); negation via `NOT EXISTS`.
Tests: `useArrayHasManyAccessConstraint` (flip), plus a blocks fixture and a nested-array positive +
exclusion case on both adapters.

### 3. Reaching through `relationship` / `upload` / `json` — deferred (two distinct problems)

**Relationship/upload (`owner.email`):** requires resolving the relation column to the related
collection's table and filtering there — a genuine join (or correlated subquery) into another
collection. Restorable via a correlated `EXISTS (SELECT 1 FROM users u WHERE u.id = "<table>".owner_id AND <op(u.email, value)>)`,
reusing `resolveRelationshipPath`/`getTableColumnFromPath` to locate the target table+column.
Polymorphic (`relationTo` array) relationships need the join keyed on both value and `relationTo`.
Significant work; `NOT EXISTS` for negatives.

**JSON subpath (`settings.approved`):** no join needed — reuse `adapter.createJSONQuery` on the
existing json column, exactly as `parseParams` (L222–294) does, but note the two adapters diverge:
postgres calls `createJSONQuery({column, operator, pathSegments, value})`; sqlite uses
`convertPathToJSONTraversal` + a hand-built `json_extract` comparison. Gate to
`supportedJSONQueryOperators` and fail closed on the rest. This is the **cheapest** item 3 win.
Absent-branch json column is NULL → `exists:false` must resolve true. Files: `createPolymorphicJoinWherePlan.ts`
(detect a json-field boundary in the path → new `jsonPath` type), `buildPolymorphicJoinWhere.ts`
(per-adapter emitter). Invariant: value must go through `sanitizeValue`/`SAFE_STRING_REGEX` (already
in both `createJSONQuery` impls) to prevent injection; unsupported operators throw.
Tests: `useNestedJSONAccessConstraint`/`useNestedRelationshipAccessConstraint` (flip) on both adapters.

### 4. `near` / `within` / `intersects` / `all` — deferred (adapter-divergent)

**Reason unsupported:** `near`/`within`/`intersects` operate on `point` columns; **sqlite has no
point support at all** (the normal path early-returns for sqlite points), and postgres needs PostGIS
distance/geometry expressions via `buildOperatorConstraint`. `all` is a has-many "contains every
value" that needs a grouped/counted subquery.

**Secure plan:** postgres-only for the geo operators — emit the same point expressions the normal
path uses through `buildOperatorConstraint`, and keep them **failing closed on sqlite** (never
silently drop the constraint). `all` → correlated subquery asserting each required value is present.
Files: same two, plus operator-support gating per adapter. Invariant: on any adapter that cannot
express the operator, throw — do **not** treat "can't compile" as "no filter" (that was the exact
PYLD-3840 fail-open). Tests: `useNearAccessConstraint` becomes a postgres-only positive test and stays
`rejects.toThrow` on sqlite.

### 5. Mixed field shape — partially restored

- **Restored:** has-many select ↔ single select with identical option values (see above).
- **Still rejected (correctly): text in one target, number in another.** This is **not safely
  restorable as-is** because of a concrete fail-open: `sanitizeQueryValue` turns a non-numeric value
  into `null` for a number field (`Number('x') → NaN → null`), and the builder then converts
  `equals <null>` into `IS NULL`. So a single shared value like `{variantValue: {equals: 'x'}}`
  applied to a number branch would silently become `variant_value IS NULL` and **match every row
  with no value** — a leak. Additionally, applying one JS value across a text column and a number
  column produces a hard type error on postgres (`text = 5`) or inconsistent affinity coercion on
  sqlite.
- **Secure plan for the text/number case:** (a) add a fail-closed guard — if a **non-null** query
  value sanitizes to `null` for a non-`exists` operator, throw rather than emit `IS NULL`; (b)
  coerce the value **per branch** to that branch's column type (e.g. `String(value)` for a text
  branch) instead of sharing one value; (c) for absent branches, compute NULL semantics from the
  operator alone rather than borrowing another branch's field to sanitize the value (today's borrow
  is itself a latent fail-open once mixed shapes are allowed). Only after (a)–(c) can the
  `scalarQueryValueSignatures.size > 1` rejection be relaxed for non-option scalars. Tests:
  `useMixedScalarFieldShapeAccessConstraint` flips to positive **and** a negative test proving a
  non-coercible value fails closed (not `IS NULL`), on both adapters.

## The absent-field "NULL table" — a cross-cutting prerequisite

Every deferred category shares one requirement the current builder handles inline and any refactor
must preserve: a leaf path present in some targets and **absent** from others must, on the absent
branches, behave as if the column were SQL `NULL`:

- `exists:false` / `equals null` / `not_equals <x>` / `in [..., null]` → match
- `exists:true` / `equals <x>` / `not_equals null` / `in [...]` (no null) → no match

The current code borrows another branch's field to sanitize the value and compares against
`sql\`null\``. That borrow is safe today only because same-shape rejection guarantees a compatible
field. Any restoration that admits mixed shapes must instead derive the absent-branch predicate from
operator semantics alone (a small pure function), or it reintroduces a fail-open.

## Cross-cutting risks

- **Adapter divergence (postgres vs sqlite).** JSON, geo, and locale/array table quoting differ
  materially (`createJSONQuery` vs `convertPathToJSONTraversal`; PostGIS vs no-point; schema-qualified
  names). Every restored category needs both-adapter integration coverage; sqlite geo must stay
  fail-closed.
- **Query planner / perf.** Each restored category adds a correlated subquery **per branch per leaf**,
  inside a UNION that is itself correlated to the parent row and re-run for counts. Deeply nested
  access `where` on a wide polymorphic join could multiply subqueries; prefer `EXISTS` (short-circuits)
  over aggregates where possible and lean on `_parent_id` indexes.
- **Caller vs access-derived `where`.** They arrive combined via
  `sanitizeJoinQuery`/`combineQueries` as one AND-ed tree, so a fix must apply uniformly — but
  access-derived `where` is the higher-severity path: one target's `read` rule using an unsupported
  shape breaks the join for _every_ request, so failing closed there is a correctness/availability
  regression, not just a rejected query. That is the argument for prioritizing categories 3 (json)
  and 1/2 next.
- **Negation correctness.** For every subquery-based category, negative operators must be
  `NOT EXISTS`/absence-aware, never a negation pushed inside `EXISTS` — the classic way a
  "restrict" access rule silently becomes permissive.
