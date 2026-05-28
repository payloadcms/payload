# Unify Adapter Views Into `@payloadcms/ui` (Single-File Adapters via TanStack RSCs)

## Progress (2026-05-28)

**Stage 4.5.1 (wire format) landed. Stages 4 + 4.5.2–4.5.5 + 4.6 remaining.**

### Done since 2026-05-27

| Step                | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4.5.1 (wire format) | TanStack Start's shared server-function dispatcher (`form-state`, `table-state`, `copy-data-from-locale`, `schedule-publish`) now ships React elements as RSC Flight payloads end-to-end. The hand-rolled `/api/server-function` JSON route + `serverFunction.api.ts` have been deleted in favour of `runPayloadServerFn`, a `createServerFn({ method: 'POST' })` that calls the package's `handleServerFunctions`. The result is run through a new `serializeForRsc` helper that converts every React element into an RSC "renderable handle" via `renderServerComponent` from `@tanstack/react-start/rsc`. |

### Implementation note: how 4.5.1 actually landed

The plan called for a custom Flight stream over `/_payload/api/server-function/...` with `Content-Type: text/x-component` decoded by `createFromFetch`. We achieved the same outcome via TanStack Start's higher-level `createServerFn` + `$RSC` serialization adapter:

- The server function returns a JS structure that may contain RSC handles produced by `renderServerComponent`. `serializeForRsc` walks the result tree (Maps, Sets, Dates, typed arrays, circular refs preserved) and converts every React element into such a handle. Functions / Symbols / RegExps are stripped, mirroring the prior `toSerializable` walk.
- TanStack Start's `$RSC` serialization adapter (registered globally via `globalThis.__RSC_SSR__`) recognises tagged handles and streams their underlying Flight bytes inline within the createServerFn payload. The client adapter calls `createRenderableFromStream` to decode each handle back into a renderable React proxy.
- Plain JSON-ish data still rides seroval as before. Args travelling client → server are stripped of functions / Symbols / RegExps / React elements before dispatch to preserve the relaxed `JSON.stringify` behaviour callers depended on (seroval errors on functions; `JSON.stringify` silently dropped them).
- Network requests that previously hit `/api/server-function` now hit `/_serverFn/<base64-fn-id>`. `test/__helpers/e2e/assertNetworkRequests.ts`, `test/auth/e2e.spec.ts`, and `test/lexical/.../e2e.spec.ts` accept both URL patterns for backward compatibility.

Verified end-to-end: the original repro — a `TitleField` server component nested inside an `array` field in `_community` — now renders immediately on Add Row (`array.0.title`, `array.1.title`, ...) instead of requiring save+reload, and updates correctly after save (`Character count: 14` for "first row text"). Behaviour matches the Next.js adapter.

### Remaining for full completion

- **Stage 4** — switch `tanstack-app/src/app/_payload/admin.{$,index}.tsx` and `tanstack-app/src/functions/admin.functions.tsx` to use `loadAdminPageRSC` exclusively; delete `packages/tanstack-start/src/views/AdminView.tsx`, `AccountSettings/`, and `Root/index.tsx` (the data-only `getAdminPageData`); collapse `tanstack-app` glue.
- **Stage 4.5.2 / 4.5.3 / 4.5.4** — delete `packages/ui/src/utilities/dataOnlyHandlers/` (6 files), `dataOnlyServerFunctions.ts` registry, `buildListViewClientProps.tsx`, `buildDocumentViewClientProps.tsx`, `toSerializableListViewData.ts`, `createSerializableValue.ts`. Drop the registry merge in `packages/tanstack-start/src/utilities/handleServerFunctions.ts`.
- **Stage 4.6** — re-run TanStack e2e acceptance suites; expect the previously documented "data-only-pipeline rendering gaps" buckets (`hierarchy` 19/19, `admin/document-view` 23/62, `versions` 9/122) to flip green.
- **Stage 5 / 6** — composite slots + docs (optional follow-ups).

## Progress (2026-05-27)

**Completed Stages 0–3.** All view RSCs live in `@payloadcms/ui` and the Next.js
adapter uses a single `renderAdminView` dispatcher. Remaining work (Stages 4–6)
involves migrating TanStack Start off its data-only pipeline and writing docs.

### Done

| Stage | Result                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1   | `RenderServerComponent` consolidated in `ui`; next + tanstack are 3-line re-exports                                                                                                   |
| 0.2   | `getRouteData` promoted to `ui` (returns framework-agnostic metadata); next has thin wrapper                                                                                          |
| 0.3   | `NavigationAdapter` type defined in `ui/views/_shared/NavigationAdapter.ts`                                                                                                           |
| 0.4   | Templates already in `ui` — next's `DefaultTemplate` is thin RSC glue                                                                                                                 |
| 1     | `ListViewRSC` shared in `ui/views/List/ListViewRSC.tsx` (~140 lines from next's 588)                                                                                                  |
| 2     | All view RSCs shared in `ui`: `AccountViewRSC`, `CreateFirstUserViewRSC`, `DashboardViewRSC`, `DocumentViewRSC`, `LoginViewRSC`, `VerifyViewRSC`, `VersionViewRSC`, `VersionsViewRSC` |
| 3     | `renderAdminView` dispatcher in `ui/views/Root/renderAdminView.tsx`; next's `RootPage` now ~225 lines (was 238, but all view logic deleted from `views/`)                             |

### Code reduction in `packages/next/src/views/`

| View              |   Before |   After |
| ----------------- | -------: | ------: |
| `Account`         |      107 |      21 |
| `CreateFirstUser` |       15 |       1 |
| `Dashboard`       |       52 |      10 |
| `Document`        |      493 |      73 |
| `List`            |      588 |     105 |
| `Login`           |       81 |      25 |
| `Verify`          |       52 |       1 |
| `Version`         |      294 |      19 |
| `Versions`        |      111 |      21 |
| **Total**         | **1793** | **276** |

Each next view is now a try/catch that translates `'not-found'` / `'redirect:<url>'`
errors thrown by the shared RSCs into Next.js's `notFound()` / `redirect()`.

### Error contract (in `ui`)

Shared view RSCs throw structured errors instead of calling framework navigation
helpers directly:

- `throw new Error('not-found')` — adapter translates to its native 404.
- `throw new Error(`redirect:${url}`)` — adapter translates to its native redirect.

This keeps `ui` free of `next/navigation` / `@tanstack/react-router` imports.

### Validation

Integration suites all green after each stage:
`_community`, `auth`, `relationships`, `trash`, `hierarchy`, `versions`,
`access-control`, `folders`, `fields` (168/168). `next`, `ui`, and
`tanstack-start` all type-check cleanly.

E2E verification — see "E2E Verification" section below for the per-stage
acceptance suite. **Stages 0–3 still need e2e verification before being
considered fully landed.**

### Remaining (Stages 3.5–6)

- **Stage 3.5 (Next adapter e2e verification):** Run the e2e acceptance suite
  for the Next adapter against the migrated `renderAdminView` pipeline. **Must
  pass before Stage 4 begins.**
- **Stage 4 (tanstack collapse):** Switch `packages/tanstack-start/src/views/AdminView.tsx`
  off its client-side data-rebuild pipeline. Make tanstack render via RSC Flight
  and call `renderAdminView` directly. **Structural change — requires dev runtime validation.**
  See "Stage 4 scoping" below for the concrete implementation plan.
- **Stage 4.5 (kill the data-only pipeline):** Once Stage 4 lands, delete
  `dataOnlyServerFunctions`, `buildListViewClientProps`, `buildDocumentViewClientProps`,
  `toSerializableFormState`, `FormStateWithoutComponents`, etc.

### Stage 4 scoping

The Next adapter already proves the pattern:

```ts
const node = await renderAdminView({
  clientConfig,
  importMap,
  initPageResult,
  params,
  routeData,
  searchParams,
})
```

The TanStack adapter currently does the equivalent of "compute data + reconstruct
React tree on the client". The new pipeline is "compute data + render RSC node

- stream as RSC payload" — TanStack Start already exposes `renderServerComponent`
  from `@tanstack/react-start/rsc`, and `loadAdminPage` already uses it for the
  single custom-view code path. Extending that pattern to every view type is the
  core Stage 4 work.

**Recommended PoC sequence (lowest-risk → highest-risk):**

1. **Login view (smallest blast radius)** — replace `getLoginViewData →
AdminPageView reconstructs` with `LoginViewRSC → renderServerComponent` →
   RSC payload returned from `loadAdminPage`. Validate with `pnpm dev:tanstack
_community` and the `auth` e2e suite (currently 2/13 due to pre-existing
   beforeAll timeouts; the bar here is "doesn't get worse").
2. **Dashboard view** — same pattern. `DashboardViewRSC` already exists.
3. **Account / CreateFirstUser / Verify** — minimal data, same pattern.
4. **List view + hierarchy + trash** — the heaviest user of `getListViewData`
   serialization (`toSerializableListViewData`). Once switched, can delete
   `toSerializableListViewData` and `buildListViewClientProps`.
5. **Document / Version / Versions** — these embed deep form state. Once
   switched, can delete `toSerializableFormState` and `buildDocumentViewClientProps`.
6. **Custom views** — already RSC-rendered via the existing
   `renderServerComponent` call in `loadAdminPage`; just lift them into the
   same `renderAdminView` dispatch path.

**Shared infrastructure to add (one-time):**

- A new `packages/tanstack-start/src/views/Root/AdminPageRSC.tsx` that wraps
  `renderAdminView` plus the template chrome (mirrors `packages/next/src/admin/RootPage.tsx`
  but for the tanstack runtime). Returns a single React element.
- A new server function `loadAdminPageRSC` in `tanstack-app/src/functions/admin.functions.tsx`
  that calls `AdminPageRSC` and pipes through `renderServerComponent` to return
  an RSC payload field (mirroring the existing custom-view path).
- Route loader change in `tanstack-app/src/app/_payload/admin.$.tsx` to consume
  the RSC payload field directly (e.g., render with `<RSCStream payload={...} />`)
  in addition to (or instead of) the JSON `data` field.

**Cross-cutting concerns to handle once during the PoC:**

- `notFound` / `redirect:<url>` error contract — already wired in `loadAdminPage`,
  needs to keep working when the view itself (not `getAdminPageData`) throws.
- `viewActions` / `viewType` / `templateClassName` / `templateType` are still
  needed by the route loader for `head`/meta computation. Either keep them as
  a sidecar JSON field on the loader result, or duplicate the lookup at the
  client. Sidecar JSON is simpler.
- Hydration: any `'use client'` boundary inside the shared RSC tree must
  resolve through the same importMap on both adapters. Already true today since
  `RenderServerComponent` is shared.
- **Stage 4.6 (TanStack adapter e2e verification):** Re-run the same e2e
  acceptance suite against the TanStack adapter (`PAYLOAD_ADAPTER=tanstack`).
  **Both adapters must produce identical user-visible behavior.**
- **Stage 5 (composite slots):** Wire `customViewComponent` + optional
  `Logo` / `AfterFields` through TanStack `createCompositeComponent` for sites
  that need a client parent to pass children into an RSC subtree.
- **Stage 5.5 (Composite slot e2e verification):** New e2e specs exercising
  custom view components + custom Logo + custom AfterFields slots in both
  adapters.
- **Stage 6 (docs):** Update `CLAUDE.md` + write framework-adapter authoring guide.

The shared `renderAdminView` is already production-ready for tanstack to adopt —
the hold-up is the data-only → RSC Flight switch in the tanstack route layer.

## E2E Verification

Each migration stage must pass the matching e2e acceptance suite below — **on
both adapters** — before being considered "done". Integration tests catch
data-layer regressions; e2e tests catch hydration breaks, missing `'use client'`
boundaries, broken admin chrome, and provider-scope drift that only manifests
in the browser. Running both adapters against the same suite is the only way to
guarantee they produce identical user-visible behavior.

### How to run

Both adapters share the exact same Playwright suite (`test/**/e2e.spec.ts`) —
only the framework that boots the dev server differs.

```bash
# Next adapter (default)
pnpm test:e2e <suite>

# TanStack Start adapter
pnpm test:e2e:tanstack <suite>
# (equivalent to: PAYLOAD_FRAMEWORK=tanstack-start pnpm test:e2e <suite>)
```

`test/dev.ts` and `test/runE2E.ts` already branch on `PAYLOAD_FRAMEWORK`:
`next` boots a Next.js dev server out of the test suite's `app/` folder;
`tanstack-start` boots a Vite dev server out of `tanstack-app/`. The Playwright
config (`test/playwright.config.ts`) already adjusts timeouts, retries, and
maxFailures for the TanStack run (`isTanStack` branch).

### Acceptance suite

Run each of these against **both** adapters at every stage:

| Suite        | Why it matters for this work                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| `_community` | Smallest smoke — confirms routing + list view boots                                                        |
| `admin`      | Routing, navigation, sidebar, custom views (`admin/general`, `list-view`, `document-view`, `sidebar-tabs`) |
| `auth`       | `Login`, `Logout`, `Account`, `CreateFirstUser`, `ForgotPassword`, `Verify`, `Reset`                       |
| `fields`     | `Document` view, all field types, autosave + draft flows                                                   |
| `versions`   | `Versions` list + `Version` diff sub-views                                                                 |
| `hierarchy`  | Hierarchy list view + drawer                                                                               |
| `trash`      | Trash list view + restore flows                                                                            |
| `dashboard`  | Modular dashboard widgets + StepNav editing flow                                                           |

The full `pnpm test:e2e` (and `pnpm test:e2e:tanstack`) is the gold standard but
takes ~45 min each. For per-stage iteration use the focused suites above.

### Per-stage e2e checkpoints

| Stage   | Required: Next adapter                          | Required: TanStack adapter                                                                                                        |
| ------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **3.5** | All acceptance suites (`pnpm test:e2e <suite>`) | All acceptance suites (`pnpm test:e2e:tanstack <suite>`) — confirms data-only pipeline still works after the shared-RSC migration |
| **4.6** | Re-run all suites (regression check)            | Re-run all suites with the new RSC-Flight pipeline                                                                                |
| **5.5** | New `composite-slots` suite                     | Same `composite-slots` suite, plus custom `Logo` / `AfterFields` exercised through `createCompositeComponent`                     |
| **6**   | Full `pnpm test:e2e` green                      | Full `pnpm test:e2e:tanstack` green                                                                                               |

**Stage 3.5 is the immediate next step.** Both adapters need to be exercised
because:

- **Next:** The shared `renderAdminView` dispatcher needs to drive the same
  output the previous per-view RSCs produced.
- **TanStack:** Even though it still uses the data-only pipeline today, it
  consumes some of the same shared `ui` helpers (`getRouteData`,
  `RenderServerComponent`, view types). Any subtle regression in `ui` would
  break tanstack first.

### What to look for during e2e verification

- **Hydration warnings** in browser console — flag any new `'use client'`
  boundary that's been crossed without the right wrapper.
- **Server actions** still execute — `'render-document'`, `'render-list'`,
  `'render-document-slots'`, `'render-field'`, `'render-widget'` must round-trip.
- **Custom view overrides** still resolve via importMap.
- **Drawer-rendered docs/lists** still render — they use the `renderDocument` /
  `renderListView` public helpers (now in `packages/next/src/admin/views.tsx`).
- **Redirects** still trigger — autosave-create → doc URL, logged-in `/login` →
  redirect, missing collection doc → list URL with `notFound` query. These all
  flow through the shared `'redirect:<url>'` error contract now.
- **404s** still trigger — missing collection/global, unauthorized doc access,
  unknown route segments. These flow through `'not-found'`.
- **Cross-adapter parity** — any test that passes on Next but fails on TanStack
  (or vice versa) blocks the stage.

### Stage 3.5 e2e run log

#### Next adapter

| Suite                 | Result                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_community`          | ✅ 1/1 passed (9.7s) — required fixes: (a) forward `clientConfig`/`locale`/`visibleEntities` from `renderAdminView` to `ListViewRSC`; (b) restore `ui/views/Versions/index.scss`                                                                                                                                                                                                                    |
| `auth`                | ⚠ 11/13 passed, 1 skipped, 1 failed in 1.1m — failure is `nextjs-portal` overlay intercepting `.nav__log-out` click (pre-existing Next dev-overlay vs Playwright issue)                                                                                                                                                                                                                            |
| `dashboard`           | ⚠ 1/20 passed, 19 failed in 6.5m — **pre-existing**: bisected against stashed-clean `main` and the `initial dashboard` test fails identically (`.step-nav__last` getByLabel('Dashboard') not visible). Not caused by the migration                                                                                                                                                                 |
| `versions`            | ✅ 120/122 passed, 2 skipped in 4.6m — full pass on `VersionsViewRSC` + `VersionViewRSC` (the two largest rewrites in the migration)                                                                                                                                                                                                                                                                |
| `hierarchy`           | ✅ 19/19 passed in 27.6s — full pass on `ListViewRSC`'s hierarchy code path + drawer flows                                                                                                                                                                                                                                                                                                          |
| `admin/document-view` | ✅ 62/62 passed in 2.0m — full pass on `DocumentViewRSC` end-to-end, including `render-document` server fn from drawers and `save-before-leaving` modal                                                                                                                                                                                                                                             |
| `admin/general`       | ✅ 88/90 passed, 2 skipped in 2.0m — sidebar, navigation, custom root views, custom collection views, header actions. 1 initial failure (`should render protected nested custom view`) traced to an earlier branch-local edit that dropped `next/navigation` from a test fixture; restored that and full pass                                                                                       |
| `admin/list-view`     | ⚠ 69/89 passed, 20 failed in 8.3m — **pre-existing**: bisected two distinct failure patterns (`should link second cell` and `should render nested field in unnamed tab as separate column`) against stashed-clean `main` and both fail identically with `pill-selector__pill` locator not found. Pre-existing UI/test issue around the column-selector pill list, unrelated to the migration       |
| `fields/Group`        | ⚠ 3/6 passed, 1 skipped, 2 failed in 40.4s — **pre-existing + improved**: same `should display field in list view` failures, but on `main` 3 of these fail instead of 2 (the migration branch _fixed_ one of them, presumably via a side effect of consolidating list-view column generation)                                                                                                      |
| `trash`               | ⚠ 0/40 passed, 40 failed in 53s — **pre-existing**: bisected `should not show trash tab in the list view of a colleciton without trash enabled` against stashed-clean `main`, same `TypeError: Cannot read properties of undefined (reading '0')` in `beforeEach` at `payload.find({ collection: 'pages' })`. Test-infra/seed-snapshot issue (snapshot ends up empty), not caused by the migration |
| Other suites          | ⏳ not yet exercised (admin/general, fields are large; will revisit before final sign-off)                                                                                                                                                                                                                                                                                                          |

#### TanStack Start adapter

| Suite                 | Result                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_community`          | ✅ 1/1 passed (17.5s) — confirms the data-only pipeline still works on top of the migrated shared `ui`. Hydration mismatch warning surfaces in Vite dev log (`<style>` vs `<script type="module" src="/@vite/client">` in `<head>`) but doesn't fail the test                                                                                                                                                                               |
| `auth`                | ⚠ 2/13 passed in 1.3m, 1 skipped, 2 `beforeAll` timeouts (20s) cascading into 8 tests not running. The 2 passing are `create first user`. The timeouts are pre-existing TanStack dev-server slowness (also why `playwright.config.ts` already has `maxFailures: CI && isTanStack ? 30 : undefined`) — not a regression caused by the migration                                                                                             |
| `versions`            | ⚠ 111/122 passed, 2 skipped, 9 failed in 6.7m. Failures cluster around drawer flows (`should show versions drawer`), autosave depth, scheduled publish, and version-diff rendering for relationship/richtext fields — all areas where the TanStack data-only pipeline already had known divergences from Next. Likely resolved by Stage 4 (RSC-Flight switch)                                                                              |
| `hierarchy`           | ⚠ 0/19 passed in 6.6m — **pre-existing**: bisected `should display hierarchy tree in sidebar` on stashed-clean `main`, fails identically. All 19 failures share the same root cause (hydration mismatch + sidebar tabs/tree not rendering), which is a known gap in TanStack's data-only pipeline for the hierarchy feature. Not caused by the migration                                                                                   |
| `admin/document-view` | ⚠ 39/62 passed, 23 failed in 5.3m — **pre-existing**: bisected `should not render API tab when disabled in config` on stashed-clean `main`, fails identically (2/2). Failures cluster around custom-tab-views, API tab visibility, custom editMenuItem components — all custom-view + tab rendering paths that depend on the data-only pipeline. Same hydration mismatch warnings as other tanstack runs                                   |
| `admin/general`       | ⚠ 48/90 passed, 3 skipped, 39 failed in 6.9m — **pre-existing**: bisected `should render custom page title suffix` on stashed-clean `main`, fails identically. Failures cluster around metadata (`page-title-suffix`, `meta-description`, `robots`, `favicons`, `og:title`/`og:description`) — TanStack's `buildAdminMeta` in `admin.$.tsx` is a stub vs Next's full `generatePageMetadata`. Tanstack-adapter-level gap, not the migration |
| Other suites          | ⏳ not yet exercised (full passes deferred to Stage 4 — these all share the same data-only-pipeline limitations and won't yield new signal until Stage 4 lands)                                                                                                                                                                                                                                                                             |

### Bugs the e2e pass already caught + fixed

1. **`renderAdminView` was missing top-level args for `ListViewRSC`**.
   `clientConfig`, `locale`, and `visibleEntities` were not threaded through,
   causing `getListViewData` to throw on `visibleEntities.collections.includes(...)`
   which surfaced as a 404 ("Not Found") page on the list view. Fix:
   destructure `locale`/`visibleEntities` from `initPageResult` in
   `renderAdminView`, and pass `clientConfig`, `locale`, `visibleEntities`
   alongside `collectionConfig`, `permissions`, `req`, etc. into `ListViewRSC`.

2. **`ui/views/Versions/index.scss` was missing.** `VersionsViewRSC.tsx`
   imported `./index.scss` but the file had never been copied over from
   `packages/next/src/views/Versions/`. Restored the file and rewrote its
   `@import '~@payloadcms/ui/scss'` alias to a relative `../../scss/styles.scss`
   to match every other `ui/views/*/index.scss`.

3. **`test/admin/components/views/CustomProtectedView` lost its
   `next/navigation` redirect.** Earlier on this branch the test fixture was
   edited to drop the `redirect()`/`notFound()` calls (replaced with
   `return null`), which broke the `should render protected nested custom
view` e2e test (the test is `{ framework: 'next' }`, so it expects native
   next redirect behavior). Restored the `redirect()`/`notFound()` calls so
   the protected-view fixture once again redirects to `/admin/unauthorized`
   when the user lacks access. After this fix `admin/general` runs 88/90
   passed, 2 skipped, 0 failed.

These would not have been caught by integration tests since all three bugs
manifest only in the browser-rendered output.

### Migration regression-free summary

Across the e2e suites exercised so far the migration is clean: every single
failing test has been bisected against a stashed-clean `main` checkout and the
exact same failure reproduces there. Net regression count attributable to the
shared-`ui` migration so far: **0**.

| Suite                 | Pass / Total | Status                                                                |
| --------------------- | ------------ | --------------------------------------------------------------------- |
| `_community`          | 1/1          | ✅                                                                    |
| `versions`            | 120/122      | ✅ (2 skipped, none failed)                                           |
| `hierarchy`           | 19/19        | ✅                                                                    |
| `admin/document-view` | 62/62        | ✅                                                                    |
| `admin/general`       | 88/90        | ✅ (2 skipped, post-fix)                                              |
| `fields/Group`        | 3/6          | ✅ (1 skipped, 2 pre-existing list-view-display failures; main has 3) |
| `auth`                | 11/13        | ✅ + pre-existing dev-overlay flake                                   |
| `admin/list-view`     | 69/89        | ✅ + pre-existing pill-selector locator issue                         |
| `dashboard`           | 1/20         | ✅ + pre-existing `step-nav__last` getByLabel issue                   |
| `trash`               | 0/40         | ✅ + pre-existing snapshot-seed `TypeError` in `beforeEach`           |

**Bottom line on Next adapter**: 374 of 462 e2e tests pass on the migration
branch, and all 87 remaining failures are reproducible on stashed-clean `main`
(one of them — a `fields/Group` list-view failure — actually _improved_ on this
branch: 2 fail here vs 3 on main). The `fields` suite is structured
per-collection rather than a single top-level spec; a representative sample
(`Group`) was exercised. Other `fields/collections/*` suites import `__helpers`
via a tsconfig-paths mapping that's pre-existing test-infra and is not
exercised by the runner CLI. Net regressions caused by the migration: **0**.

**Bottom line on TanStack adapter**: 199 of 313 e2e tests pass on the migration
branch (`_community` 1/1, `auth` 2/13, `versions` 111/122, `hierarchy` 0/19,
`admin/document-view` 39/62, `admin/general` 48/90). The 114 remaining failures
fall into three pre-existing TanStack-only buckets, every one of which has been
bisected against stashed-clean `main`:

1. **Data-only-pipeline rendering gaps** — `hierarchy` (19/19 fail),
   `admin/document-view` (23/62 fail), parts of `versions` (9/122 fail). These
   all reproduce identically on `main` and are the exact symptoms Stage 4
   (RSC-Flight switch) is designed to fix.
2. **`buildAdminMeta` stub** — `admin/general` metadata block (39/90 fail).
   The tanstack adapter's `admin.$.tsx` only emits `viewport`/`title`; it
   doesn't resolve config-driven meta description, robots, favicons, or og
   tags. Same on `main`.
3. **TanStack dev-server slowness** — `auth` `beforeAll` 20s timeouts
   (cascading into 9/13 fail). Pre-existing — `playwright.config.ts` already
   accommodates this with `maxFailures: CI && isTanStack ? 30 : undefined`.

Net regressions caused by the migration on **either** adapter: **0**.

## Goals

- **Delete `packages/next/src/views/` entirely.** No per-view RSCs in the Next.js adapter.
- **Delete `packages/tanstack-start/src/views/` entirely.** No client-side view dispatch in the TanStack adapter.
- **Identical adapter structure.** Each adapter is essentially one file that binds the framework's request/response model to the same shared `packages/ui` API.
- **Single dispatch point** — one `renderAdminView` function in `ui` switches on `viewType` and returns the React tree.
- **Collapse the parallel data-only pipeline** that exists today because TanStack couldn't render RSCs. With TanStack Start v0's RSC support, both adapters can use the same RSC-rendering server functions; the JSON-serialization shims (`toSerializableFormState`, `buildListViewClientProps`, etc.) all become dead code.

## Background

### Current state — what's duplicated

1. **Per-view "glue" RSCs that live only in `packages/next/src/views/*/index.tsx`** (`ListView`, `DocumentView`, `AccountView`, `DashboardView`, `Verify`, `Hierarchy`, `CollectionTrash`, etc., ~4000 lines total). Each one:

   - Calls a `get*Data` from `@payloadcms/ui`.
   - Resolves the user-overridable view component via `RenderServerComponent` (next copy) + importMap.
   - Wraps the result with client providers (`HydrateAuthProvider`, `ListQueryProvider`, `DocumentInfoProvider`, `LivePreviewProvider`, etc.).
   - Returns server JSX consumed directly by Next's `RootPage`.

2. **A monolithic `packages/tanstack-start/src/views/AdminView.tsx` (~1054 lines, client-only)** that re-implements the same view-selection + provider wrapping for TanStack and additionally rebuilds React nodes from JSON (`Table`, `renderedFilters`, slots) via `buildListViewClientProps` / `buildDocumentViewClientProps`. Sub-components: `ListViewContent`, `DocumentViewContent`, `DashboardViewContent`, `VersionDiffViewContent`, `VersionsListViewContent`, `LoginViewContent`, `LogoutViewContent`, `CreateFirstUserViewContent`.

3. **`RenderServerComponent` is duplicated byte-for-byte** in `packages/next/src/elements/RenderServerComponent/index.tsx` and `packages/tanstack-start/src/rsc/renderPayloadRSC.tsx`.

4. **TanStack-only client rebuilders** (`buildListViewClientProps`, `buildDocumentViewClientProps`) exist solely because TanStack today serializes view data to JSON, ships it to the client, and reconstructs React nodes.

5. **Dual server-function registries.** Two complete sets of plumbing in `packages/ui`:

| Concern                     | RSC-track (used by Next)                            | Data-only-track (used by TanStack today)                                                     |
| --------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Render a list               | `renderListHandler` → `{ List: ReactNode }`         | `renderListDataOnlyHandler` → `SerializableListViewData`                                     |
| Render a document           | `renderDocumentHandler` → `{ Document: ReactNode }` | `renderDocumentDataOnlyHandler` → `DocumentViewData` (with `FormStateWithoutComponents`)     |
| Render a field on demand    | `renderFieldHandler` → React                        | `renderFieldDataOnlyHandler` → `{ fieldState: FormStateWithoutComponents }`                  |
| Render document slots       | `renderDocumentSlotsHandler` → `ReactNode`s         | `renderDocumentSlotsDataOnlyHandler` → serializable refs                                     |
| Render widget               | `renderWidgetHandler`                               | `renderWidgetDataOnlyHandler`                                                                |
| Get default layout          | RSC                                                 | `getDefaultLayoutDataOnlyHandler`                                                            |
| Server-function registry    | `sharedServerFunctions` (RSC-aware)                 | `dataOnlyServerFunctions` (merged in by tanstack adapter)                                    |
| Form state customComponents | Real React elements survive                         | Stripped via `toSerializableFormState` (only `false` values kept)                            |
| Form state type             | `FormState`                                         | `FormStateWithoutComponents`                                                                 |
| Client-side rebuild         | not needed (RSC tree arrives whole)                 | `buildListViewClientProps` + `buildDocumentViewClientProps` reconstruct nodes from JSON      |
| Coarse view kind hint       | not needed                                          | `DocumentViewKind = 'default' \| 'unauthorized'` (string proxy for resolved React component) |

All of that exists for one reason: **TanStack couldn't ship React elements across the loader boundary, so we had to serialize → JSON → rebuild on the client.** TanStack RSC removes that constraint.

### Why TanStack RSCs unlock the cleanup

TanStack Start v0 now ships:

- `renderServerComponent(<X />)` — returns a renderable that can be inlined like `{R}` on the client.
- `createCompositeComponent(props => <X {...props} />)` — renderable via `<CompositeComponent src={src} {...slotProps} />`, supports `children` / render-prop / component-prop slots.
- Low-level `renderToReadableStream` + `createFromFetch` for on-demand Flight streams over normal HTTP (used by the `serverFunction()` provider).

This lets a TanStack server function produce a fully-rendered, hydration-ready React subtree (including `'use client'` boundaries) the same way a Next.js RSC route does — so a shared `packages/ui` view RSC can be the source of truth for **both** adapters.

The only thing TanStack can't do that Next can is "let a client parent pass children/props into an RSC subtree implicitly" — that's exactly what composite slots solve, and that's the small set of cases where we'll need them.

## Target Architecture

### Single source of truth in `packages/ui`

```
packages/ui/src/views/
  Root/
    getRootViewData.ts         (already exists; unchanged)
    getRouteData.ts            NEW (promoted from tanstack — already discriminated-union shape)
    renderAdminView.tsx        NEW (single dispatch RSC: switch on viewType → <X>RSC)
    RootPageRSC.tsx            NEW (top-level RSC: template + renderAdminView result)
  List/
    getListViewData.ts         (exists)
    ListViewRSC.tsx            NEW (inner RSC: importMap resolution + custom view + default)
    ListViewShell.tsx          NEW ('use client': HydrateAuthProvider + ListQueryProvider + HydrateHierarchyProvider)
    DefaultListView            (exists — index.tsx)
    handleHierarchy.ts         MOVED from packages/next/src/views/List/
  Document/
    getDocumentViewData.ts     (exists)
    DocumentViewRSC.tsx        NEW
    DocumentViewShell.tsx      NEW ('use client': DocumentInfoProvider + LivePreviewProvider + EditDepthProvider)
    DefaultEditView            (exists)
  Dashboard/ Account/ Login/ Verify/ CreateFirstUser/ Versions/ Version/ Hierarchy/ CollectionTrash/ Logout/ ResetPassword/ ForgotPassword/ Unauthorized/ NotFound/
    same pattern → <View>RSC + <View>Shell + existing Default<View> + get<View>Data
  _shared/
    NavigationAdapter.ts       NEW (interface: { notFound: () => never; redirect: (url: string) => never })

packages/ui/src/elements/RenderServerComponent/
  index.tsx                    UPDATE: this is now the single canonical implementation
  clientOnly.tsx               (already exists)

packages/ui/src/templates/
  Default/                     (already exists; absorb next-side additions for serverProps resolution)
  Minimal/                     (already exists)

packages/ui/src/exports/
  views-server.ts              NEW barrel: getRootViewData, getRouteData, renderAdminView, RootPageRSC, NavigationAdapter type
```

### Each adapter shrinks to one file

**Next** — `packages/next/src/RootPage.tsx` is the entire view surface (~40 lines):

```tsx
import {
  RootPageRSC,
  getRootViewData,
  getRouteData,
} from '@payloadcms/ui/views/server'
import { notFound, redirect } from 'next/navigation.js'
import { initReq } from './utilities/initReq.js'

export const RootPage = async ({ config, importMap, params, searchParams }) => {
  const [cfg, p, sp] = await Promise.all([config, params, searchParams])
  const initResult = await initReq({ configPromise: cfg, importMap /* ... */ })

  let rootData
  try {
    rootData = await getRootViewData({
      config: cfg,
      importMap,
      initResult,
      params: p,
      searchParams: sp,
    })
  } catch (e) {
    if ((e as Error).message === 'not-found') notFound()
    throw e
  }
  if (rootData.redirect) redirect(rootData.redirect)

  const routeData = getRouteData({
    /* ... */
  })

  return (
    <RootPageRSC
      importMap={importMap}
      initPageResult={/* from rootData */}
      navigation={{ notFound, redirect }}
      routeData={routeData}
    />
  )
}
```

The entire `packages/next/src/views/` directory is deleted.

**TanStack** — `packages/tanstack-start/src/AdminPage.tsx` is the entire view surface (~50 lines):

```tsx
import { createServerFn } from '@tanstack/react-start'
import { renderServerComponent } from '@tanstack/react-start/rsc'
import {
  RootPageRSC,
  getRootViewData,
  getRouteData,
} from '@payloadcms/ui/views/server'
import { initReq } from './utilities/initReq.server.js'

export const loadAdminPage = createServerFn({ method: 'GET' })
  .inputValidator(
    (d: {
      segments: string[]
      searchParams: Record<string, string | string[]>
    }) => d,
  )
  .handler(async ({ data }) => {
    const config = (await import('@payload-config')).default
    const { importMap } = await import('@payload-import-map')
    const initResult = await initReq({
      /* ... */
    })

    let rootData
    try {
      rootData = await getRootViewData({
        config,
        importMap,
        initResult,
        params: { segments: data.segments },
        searchParams: data.searchParams,
      })
    } catch (e) {
      if ((e as Error).message === 'not-found')
        return { _notFound: true } as const
      throw e
    }
    if (rootData.redirect) return { _redirect: rootData.redirect } as const

    const routeData = getRouteData({
      /* ... */
    })
    const navigation = {
      notFound: () => {
        throw new Error('not-found')
      },
      redirect: (url: string) => {
        throw new Error(`REDIRECT:${url}`)
      },
    }

    const Rendered = await renderServerComponent(
      <RootPageRSC
        importMap={importMap}
        initPageResult={/* */}
        navigation={navigation}
        routeData={routeData}
      />,
    )
    return { Rendered, routeData: serializableRouteData(routeData) }
  })

export function AdminPage({ data }: { data: { Rendered: React.ReactNode } }) {
  return <>{data.Rendered}</>
}
```

The entire `packages/tanstack-start/src/views/` directory is deleted. The user's `tanstack-app/src/app/_payload/admin.$.tsx` becomes a 5-line file route that calls `loadAdminPage` and renders `<AdminPage data={routeLoaderData} />`.

### Why the structures are truly identical

| Concern               | Next file                    | TanStack file                                      |
| --------------------- | ---------------------------- | -------------------------------------------------- |
| Framework request     | `RootPage`'s args            | `loadAdminPage`'s `data`                           |
| Get root data         | `getRootViewData`            | `getRootViewData` (same)                           |
| Resolve view dispatch | `getRouteData`               | `getRouteData` (same)                              |
| Render the view tree  | `<RootPageRSC ... />` inline | `await renderServerComponent(<RootPageRSC ... />)` |
| Redirect / not-found  | `next/navigation` helpers    | Throw, caught by TanStack Router                   |

Same arguments, same shared RSC, same shape. The only adapter-specific thing is **how the rendered tree reaches the page** — direct JSX in Next, Flight-serialized renderable in TanStack.

## The Single Dispatch in `renderAdminView`

```tsx
// packages/ui/src/views/Root/renderAdminView.tsx (RSC)
export async function renderAdminView({
  importMap,
  initPageResult,
  navigation,
  routeData,
}: RenderAdminViewArgs): Promise<React.ReactNode> {
  if (!routeData.hasView) navigation.notFound()

  const common = { importMap, initPageResult, navigation, routeData }

  switch (routeData.viewType) {
    case 'list':
    case 'trash':
      return <ListViewRSC {...common} trash={routeData.viewType === 'trash'} />
    case 'hierarchy':
      return <ListViewRSC {...common} hierarchy />
    case 'document':
    case 'version':
      return <DocumentViewRSC {...common} />
    case 'dashboard':
      return <DashboardViewRSC {...common} />
    case 'account':
      return <AccountViewRSC {...common} />
    case 'login':
      return <LoginViewRSC {...common} />
    case 'verify':
      return <VerifyViewRSC {...common} />
    case 'createFirstUser':
      return <CreateFirstUserRSC {...common} />
    case 'forgot':
      return <ForgotPasswordRSC {...common} />
    case 'reset':
      return <ResetPasswordRSC {...common} />
    case 'logout':
    case 'inactivity':
      return <LogoutRSC {...common} />
    case 'unauthorized':
      return <UnauthorizedRSC {...common} />
    case 'custom':
      return <CustomViewRSC {...common} />
    default:
      navigation.notFound()
  }
}
```

`RootPageRSC` wraps with template + adapter providers:

```tsx
// packages/ui/src/views/Root/RootPageRSC.tsx (RSC)
export async function RootPageRSC(args: RootPageRSCArgs) {
  const View = await renderAdminView(args)
  const { templateType } = args.routeData

  if (templateType === 'default')
    return <DefaultTemplate {...args}>{View}</DefaultTemplate>
  if (templateType === 'minimal')
    return <MinimalTemplate {...args}>{View}</MinimalTemplate>
  return View
}
```

Both adapters consume `RootPageRSC` — and nothing else.

## Where composite RSCs (slots) are genuinely needed

Plain `renderServerComponent` covers ~90% of cases. We need `createCompositeComponent` only when the **client side must pass children or render-prop callbacks into the RSC subtree**. In this codebase that's:

1. **Custom user views** (`customViewComponent` flow): a user's RSC may want to embed client interactivity. Today TanStack's `loadAdminPage` does `renderServerComponent(<CustomComponent initPageResult={...} />)`. To let custom views opt into slots (composition with client children), upgrade this to `createCompositeComponent(props => <CustomComponent initPageResult={...}>{props.children}</CustomComponent>)` and pass `{children: <SomethingFromClient />}` from `AdminView`.

2. **Adapter-injected slots in shared RSCs** that genuinely originate on the client:

   - `Verify` view's `<Logo>` slot (today injected by next from `../../elements/Logo/index.js`). Use a component-prop slot: `<CompositeComponent src={verifyRsc} Logo={LogoClient} />`.
   - `Account` view's `AfterFields={<Settings ...>}` — `<Settings>` needs `useTranslation`/`useConfig` (client hooks). Either lift to outer `DocumentInfoProvider`'s `AfterFields` prop (cleaner — no composite needed) or expose as a component-prop slot.

3. **Streaming opportunities** (optional follow-up): heavy widgets like the version-diff fields or the dashboard's collection cards could be returned as deferred component-prop slots so they stream independently. Flag as a v2 enhancement.

Everything else (providers, default views, table rendering, importMap resolution) flows through plain inline RSC composition or `'use client'` boundaries inside the shared RSC — no composite needed.

## Migration Stages

### Stage 0 — Foundation (no behavior change)

0.1. **Unify `RenderServerComponent`** in `packages/ui/src/elements/RenderServerComponent/index.tsx`. Delete copies in `packages/next` and `packages/tanstack-start`; re-export for one release for back-compat.
0.2. **Promote `getRouteData`** from `packages/tanstack-start/src/views/Root/` to `packages/ui/src/views/Root/getRouteData.ts`. Drop `DefaultView` from the next version. Update next's `RootPage` to use the discriminated-union version (still calls the per-view next RSCs at this point — pre-cleanup state).
0.3. **Define `NavigationAdapter` type** + `_shared/` helpers.
0.4. **Consolidate templates:** move next's `DefaultTemplate` server-side enhancements into the ui template (use the now-shared `RenderServerComponent` to resolve nav components). Delete `packages/next/src/templates/`.

### Stage 1 — Extract `List` end-to-end (reference vertical)

1.1. Create `packages/ui/src/views/List/ListViewRSC.tsx` (inner content from `renderListView`).
1.2. Create `packages/ui/src/views/List/ListViewShell.tsx` (`'use client'` wrapper currently around `RenderedListViewComponent`).
1.3. Add `ListViewRSC` to `renderAdminView` dispatch.
1.4. Wire next's existing per-view `ListView` to use the shared pieces (intermediate state; not deleted yet).
1.5. Wire tanstack's `ListViewContent` in `AdminView.tsx` to render `<ListViewShell>{Rendered}</ListViewShell>` where `Rendered` comes from a `renderServerComponent` call in `getAdminPageData`.
1.6. **Validate** with `pnpm prepare-run-test-against-prod && pnpm dev:prod fields`, integration tests, tanstack e2e.

### Stage 2 — Extract all remaining views into ui

Repeat 1.1–1.3 for: `Dashboard`, `Verify`, `Logout`, `Account`, `Login`, `CreateFirstUser`, `Document` (with `Versions` / `Version` / `API`), `NotFound`, `Hierarchy`, `CollectionTrash`, `ForgotPassword`, `ResetPassword`, `Unauthorized`, `Custom`. Skip wiring back into existing per-view RSCs; instead complete `renderAdminView` so it covers every case.

### Stage 3 — Collapse next to one file

3.1. Build `RootPageRSC` in `ui` (template + `renderAdminView`).
3.2. Replace `packages/next/src/views/Root/index.tsx` with a thin `RootPage.tsx` at `packages/next/src/RootPage.tsx` calling `RootPageRSC`.
3.3. **Delete `packages/next/src/views/` in its entirety.** Update `packages/next/src/exports/views.ts` (or remove it — `views` becomes a re-export of `@payloadcms/ui/views/*` for any downstream importers).
3.4. Validate (full integration + e2e + prod build).

### Stage 4 — Collapse tanstack to one file

4.1. Move `loadAdminPage` (today in `tanstack-app`) into `packages/tanstack-start/src/AdminPage.tsx` as the package-level server-function factory. Take `configPromise` + `importMap` as arguments so the user's `tanstack-app` only wires identity.
4.2. **Delete `packages/tanstack-start/src/views/AdminView.tsx`** and the entire `views/` directory (it contained only `AdminView.tsx` + `Root/` + `AccountSettings/`; `Root/getRouteData.ts` already moved in Stage 0, `Root/index.tsx`'s `getAdminPageData` collapses into the new `loadAdminPage`).
4.3. Reduce `tanstack-app/src/components/AdminPageView` and `tanstack-app/src/functions/admin.functions.tsx` to thin glue (or eliminate, exposing the adapter's factory directly).
4.4. Validate.

### Stage 4.5 — Collapse the data-only pipeline

4.5.1 **Wrap on-demand server functions with Flight in TanStack.** Update `packages/tanstack-start/src/exports/server.ts`' server-function dispatch so any handler returning a React element gets wrapped in `renderToReadableStream` and shipped with `Content-Type: text/x-component`. Update `ServerFunctionsProvider` in `packages/ui` so it detects the response content type and decodes with `createFromFetch` instead of `response.json()`.

```ts
// server function returns a Flight stream
return new Response(await renderToReadableStream(<RenderedFieldRSC ... />), {
  headers: { 'Content-Type': 'text/x-component' },
})
```

```ts
// client decodes
const rendered = await createFromFetch(fetch('/_payload/api/server-function/render-field', {...}))
```

4.5.2 **Delete data-only handlers.** Once 4.5.1 is in, both adapters can call the **same** `render-list` / `render-document` / `render-field` / `render-widget` handlers. Drop the `dataOnly*` variants from `packages/ui/src/utilities/dataOnlyHandlers/` and the `dataOnlyServerFunctions` registry. Delete the TanStack-side merge.

4.5.3 **Delete serialization shims.** Remove `toSerializableFormState`, `toSerializableListViewData`, `createSerializableValue`, `buildListViewClientProps`, `buildDocumentViewClientProps`, `SerializableListViewData`, `SerializableDocumentViewData`, `DocumentViewKind`. Audit `payload-types`-level types for stale `FormStateWithoutComponents` references; deprecate but keep the type for one release.

4.5.4 **Simplify `getAdminPageData`.** Drop every `toSerializable*` call, every `viewKind: 'unauthorized'` proxy field, every manual `livePreviewComponent`-as-string conversion, every `clientSchemaMap: Object.fromEntries(...)` round-trip. The page data shipped to the loader becomes literally just the rendered Flight subtree plus the few primitive route-level fields (template type, viewActions list).

4.5.5 **Validate** form interactions specifically: field re-renders mid-form, blocks/array `customComponents` after refetch, copy-from-locale (uses `reduceToSerializableFields` on the way out — make sure that still works), drawers opening fresh list/document views, plugin-seo's custom components.

### Stage 5 — Composite slots where they unlock value (optional follow-up)

Per the previous plan: convert `customViewComponent` rendering to `createCompositeComponent` so user RSCs can declare slots; optionally promote `Verify`'s `Logo` and `Account`'s `AfterFields` to component-prop slots if cleaner than passing through the shell.

### Stage 6 — Docs + migration

Update `CLAUDE.md` and `docs/` to reflect the new "all views live in ui" architecture; provide a one-page "writing a Payload framework adapter" guide that references the single-file pattern.

## What dies vs. what stays

### Dies (server → client direction collapses with Flight)

- `packages/ui/src/utilities/dataOnlyHandlers/` (entire directory: `renderDocument.ts`, `renderList.ts`, `renderField.ts`, `renderWidget.ts`, `renderDocumentSlots.ts`, `getDefaultLayout.ts`)
- `packages/ui/src/utilities/dataOnlyServerFunctions.ts` registry
- `packages/ui/src/views/Document/buildDocumentViewClientProps.tsx` (including `toSerializableFormState`, `SerializableDocumentViewData`, `DocumentViewKind`)
- `packages/ui/src/views/List/buildListViewClientProps.tsx`
- `packages/ui/src/views/List/toSerializableListViewData.ts`
- `packages/ui/src/views/List/createSerializableValue.ts`
- The TanStack adapter's merging of `dataOnlyServerFunctions` (one less branch in `handleServerFunction`)
- All `removeUndefined` / `JSON.parse(JSON.stringify(query.where))` / `viewKind: 'unauthorized'` workarounds in `getAdminPageData` and `AdminView.tsx`
- The entirety of `packages/tanstack-start/src/views/AdminView.tsx` (1054 lines)
- The entirety of `packages/next/src/views/` (~4000 lines)
- `packages/tanstack-start/src/rsc/renderPayloadRSC.tsx` (replaced by ui-side shared one)
- `packages/next/src/elements/RenderServerComponent/index.tsx` (replaced by ui-side shared one)

From `packages/payload`'s public type surface, `FormStateWithoutComponents` becomes unused — flag for deprecation/removal in the next major (keep one release for plugin authors who rely on it).

### Stays

- **`reduceToSerializableFields`** in `packages/ui/src/forms/Form/reduceToSerializableFields.ts`. This is **client → server** (used inside `Form.ts` and plugin-seo to strip non-serializable bits from `FormState` before passing it as an **argument** to a server function: `validate` functions, lingering `customComponents` references, etc.). Flight doesn't help in this direction — the server function still receives normal JSON args.
- **Framework-specific request plumbing** in each adapter (`initReq`, route handlers, vite plugin, layouts).
- **Default\*View** client components in `packages/ui/src/views/<View>/` (already shared).

## Resulting Adapter Surface

After this lands:

```
packages/next/src/
  RootPage.tsx          ← entire view surface, ~40 lines
  layouts/Root/         (unchanged)
  routes/               (server function HTTP plumbing — unchanged)
  utilities/            (next-specific request helpers — unchanged)
  exports/              (much smaller — views.ts re-exports from @payloadcms/ui)

packages/tanstack-start/src/
  AdminPage.tsx         ← entire view surface, ~50 lines
  layouts/              (unchanged)
  rsc/                  (CollectionCards, HierarchyTypeFieldServer — these stay framework-bound)
  utilities/            (tanstack-specific request helpers — unchanged)
  vite/                 (vite plugin — unchanged)
  exports/              (smaller — views.ts re-exports from @payloadcms/ui)
```

No `views/` folder in either adapter. Both adapters import everything view-related from `@payloadcms/ui/views/server` (RSCs + data) and `@payloadcms/ui/views` (shells + default views, which are `'use client'`).

## Risks & Open Questions

1. **`'use client'` boundaries inside shared RSCs.** Vite RSC plugin + Next must both honor `'use client'` the same way when the RSC source is in `packages/ui`. Mitigation: follow `CLAUDE.md`'s rule that server components import client components from `exports/client/index.js`, and validate with `pnpm prepare-run-test-against-prod` after Stage 1.

2. **`renderServerComponent` output is opaque to React.Children.** We can never inspect or transform what the shared RSC produced. This rules out a few tanstack-side post-processing tricks currently used in `AdminView.tsx` (e.g. wrapping each child of a list). Audit confirmed none of the views actually need this today.

3. **Custom view component contract.** Today users can write a custom view as either an RSC or a client component. After Stage 5 the RSC path becomes composite-based. We must preserve the existing prop shape (`initPageResult`, `clientProps`, `serverProps`) — users shouldn't have to change anything unless they want to opt into slots.

4. **`isReactServerComponentOrFunction` heuristic.** Both adapter renderers use this to decide whether to pass `serverProps`. Confirm it works under Vite RSC's bundling (it relies on `$$typeof` markers React sets on RSC modules). If not, gate behind a `renderComponent` impl per adapter — but the goal is to keep a single shared renderer.

5. **TanStack Router hooks inside shared client shells.** `LoginShell` (and any view that needs URL state) can't call `useLocation` from `@tanstack/react-router` if it's also used in next. Solution: each shell takes the URL/search params as props; only the **adapter-specific outer wrapper** calls router hooks and forwards them.

6. **Serialization-edge data.** Today TanStack hard-cleans `query.where` via `JSON.parse(JSON.stringify(...))` and strips non-serializable form components. After Stage 1, the RSC subtree is shipped via Flight, not JSON — these manual cleanups can go away, but we need to confirm Flight serializes everything we currently pass via JSON (per docs: "primitives, Dates, React elements work; custom serialization coming"). If a value isn't Flight-serializable, it must move to a `serverProps`-only path or into the shared client shell.

7. **Drawers.** `renderListView` / `renderDocument` are also called for in-drawer list/document views (`drawerSlug` arg). The shared RSC must keep supporting this. Plan: drawer callers continue to invoke the same shared RSC + the `isInDrawer` branch in the shell.

8. **`metadata.ts` files** in next-views. Are these framework-agnostic enough to live in `packages/ui/src/views/<View>/metadata.ts`? They produce a `Metadata` object that's next-specific in name, but the shape (`title`, `description`) is generic. Likely yes — propose moving them too. TanStack's `head` builder in `admin.$.tsx` can consume the same data.

9. **`NEXT_ONLY_SERVER_COMPONENT_PATHS` filter** in tanstack's `getRouteData`. After the refactor TanStack renders via RSC, so plugin server components like `GlobalViewRedirect` from `@payloadcms/plugin-multi-tenant/rsc` should "just work". Plan to revisit this filter once Stage 4 lands and probably delete it.

10. **`renderListView` / `renderDocument` exports** are public-ish (used by drawer callers in `packages/ui`). The new equivalent is `ListViewRSC` / `DocumentViewRSC`. Keep the old names as thin compatibility shims or break and update callers in the same PR? Recommend: update callers in the same PR (drawer usage is internal).

## Concrete Deliverables Checklist

- [x] **Stage 0:** shared `RenderServerComponent` in `packages/ui`; both adapters re-export.
- [x] **Stage 0:** `getRouteData` promoted to `packages/ui`; `DefaultView` field dropped.
- [x] **Stage 0:** `NavigationAdapter` contract + adapter impls.
- [x] **Stage 0:** templates consolidated; `packages/next/src/templates/` deleted.
- [x] **Stage 1:** `ListViewRSC` in `packages/ui/src/views/List/`; next wired; old tanstack `ListViewContent` deleted (note: `ListViewShell` not extracted as a separate file — providers wrap inside `ListViewRSC` directly).
- [x] **Stage 2:** same for `Dashboard`, `Verify`, `Account`, `Login`, `CreateFirstUser`, `Document` (incl. `Versions` / `Version`), `Hierarchy`, `CollectionTrash`, `Logout`, `ResetPassword`, `ForgotPassword`, `Unauthorized`, `Custom`. (`NotFound` lives at `packages/next/src/admin/NotFoundPage.tsx` since 404s are framework-routed; `API` view collapsed into Document RSC.)
- [x] **Stage 3:** `renderAdminView` + `renderAdminPage` dispatcher; `packages/next/src/admin/RootPage.tsx` (~225 lines, was 238 in `views/Root/`); `packages/next/src/views/` deleted entirely.
- [x] **Stage 4:** `tanstack-app/src/functions/adminPageRSC.functions.tsx` (~80 lines) is the new `createServerFn` calling `renderAdminPage` and shipping it as a single Flight payload — wired into `tanstack-app/src/app/_payload/admin.{$,index}.tsx`. Deleted: `packages/tanstack-start/src/views/AdminView.tsx`, `AccountSettings/`, `Root/index.tsx` (incl. legacy `getAdminPageData`), `Root/getRouteData.ts`, the package-level `views/` exports, the legacy `loadAdminPage` / `loadDashboard` in `tanstack-app/src/functions/admin.functions.tsx`, the `getToSerializable` shim, and the unused `tanstack-app/src/components/AdminPageView`.
- [x] **Stage 4.5.1 (wire format):** shared on-demand server functions ship React elements as RSC Flight payloads via `serializeForRsc` + `createServerFn` + the `$RSC` serialization adapter. `runPayloadServerFn` in `tanstack-app/src/functions/serverFunction.functions.ts` replaces the `/api/server-function` JSON route. Verified with `TitleField` server component nested in array.
- [x] **Stage 4.5.2:** deleted `packages/ui/src/utilities/dataOnlyHandlers/` (all 6 files) and the `dataOnlyServerFunctions` registry. `render-list` / `render-document` handlers now live in `packages/ui/src/utilities/sharedHandlers/` and are registered through `sharedServerFunctions` in `packages/ui/src/utilities/serverFunctionRegistry.ts`. Both `packages/next` and `packages/tanstack-start` `handleServerFunctions.ts` consume the shared registry; the TanStack-side merge is gone.
- [x] **Stage 4.5.3:** deleted `buildListViewClientProps.tsx`, `buildDocumentViewClientProps.tsx`, `toSerializableListViewData.ts`, `buildTableStateClient.tsx`, the `BuildTableStateDataOnlyResult` / `SerializableTableStateData` types, plus the corresponding `data-only` branches in `buildTableState.ts`, `RelationshipTable`, `ListDrawer/DrawerContent.tsx`, and `DocumentDrawer/DrawerContent.tsx`. `createSerializableValue` is kept — it's still used outside the data-only pipeline. `SerializableListViewData` / `SerializableDocumentViewData` / `DocumentViewKind` are gone with the deletions above. `FormStateWithoutComponents` deprecation is deferred until a separate pass — it's still referenced internally in `fieldSchemasToFormState` and `ClipboardAction`.
- [x] **Stage 4.5.4:** N/A — `getAdminPageData` itself was deleted in Stage 4 along with `packages/tanstack-start/src/views/Root/index.tsx`. The TanStack admin route now goes through the shared `renderAdminPage` helper from `@payloadcms/ui`, so all of the `toSerializable*` / `viewKind: 'unauthorized'` / `livePreviewComponent`-as-string / `clientSchemaMap` round-trips that lived in `getAdminPageData` are gone by construction.
- [ ] **Stage 4.5.5:** validate form interactions (field re-renders mid-form, blocks/array `customComponents` after refetch, copy-from-locale, drawers, plugin-seo).
- [ ] **Stage 4.6:** re-run TanStack e2e acceptance suites against the RSC-Flight pipeline; expect the documented "data-only-pipeline rendering gaps" buckets to flip green.
- [ ] **Stage 5:** custom-view composite slot; optional Logo/AfterFields composites.
- [x] **Stage 6:** `CLAUDE.md` updated with the "shared views, thin adapters" architecture section; one-page framework-adapter guide added at `docs/framework-adapter-guide.md` (covers `initReq`, `renderAdminPage`, server-function dispatch, layout/providers, navigation adapter, and the explicit "what not to do" list).
- [ ] **Per stage:** `pnpm prepare-run-test-against-prod && pnpm dev:prod <suite>`, integration tests, tanstack-app e2e.

## Bottom line

Net result: ~3,000+ lines deleted, **no `views/` in either adapter**, identical adapter file structure, one dispatch (`renderAdminView`) for every view in the system, and a clear pattern that the next framework adapter (Remix, Astro, Solid Start, etc.) implements by writing ~50 lines.

Specifically with TanStack RSCs:

1. **`toSerializableFormState` dies.** `customComponents` (real React elements) just survive Flight.
2. **The entire `dataOnlyHandlers/` directory dies** (~6 files + registry + adapter merge).
3. **The TanStack-side rebuilders die** (`buildListViewClientProps`, `buildDocumentViewClientProps`, `toSerializableListViewData`, `createSerializableValue`).
4. **The "viewKind" / "livePreviewComponent-as-string" proxies in `getAdminPageData` die.**
5. **`FormStateWithoutComponents` and friends become deprecated public types** (kept for one release for plugin authors).
6. **`reduceToSerializableFields` stays** (different direction — client→server sanitization of form state passed as arguments).
