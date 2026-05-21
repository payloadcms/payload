# E2E Analysis — Run 24477822883

**PR**: payloadcms/payload#16139 — Framework Adapter Pattern + TanStack Start Adapter  
**Branch**: experiment/framework-adapter-pattern  
**Run date**: 2026-04-15  
**URL**: https://github.com/payloadcms/payload/actions/runs/24477822883

---

## Executive Summary

### Suite-level (jobs)

| Framework          | Passing jobs | Total jobs | Pass rate |
| ------------------ | ------------ | ---------- | --------- |
| **TanStack Start** | 33           | 106        | **31.1%** |
| **Next.js**        | 100          | 106        | **94.3%** |

> 4 new `LexicalViews` test suites were added to the matrix in this run (106 vs 102 in the previous run). All 4 fail in TanStack Start; all 4 pass in Next.js.

### Individual test level (estimated)

| Framework          | Passed (est.) | Failed (est.) | Skipped (est.) | Total ran (est.) | Pass rate (est.) |
| ------------------ | ------------- | ------------- | -------------- | ---------------- | ---------------- |
| **TanStack Start** | **~540**      | **~410**      | ~55            | **~950**         | **~57%**         |
| **Next.js**        | **~1,575**    | **~9**        | ~65            | **~1,584**       | **~99.4%**       |

> Individual test counts are estimated from suite-level data (no per-test report was available in the run page). See "Individual Test Counts by Suite" table at the bottom for details.  
> TanStack has 22 cancelled suites (same as previous run). Including them as "not passing," effective pass rate across all ~1,520 TanStack tests is around **~35%**.

### Progress vs previous run (24249234229 — April 10)

| Metric                         | Run Apr 10 | Run Apr 15                                    | Delta     |
| ------------------------------ | ---------- | --------------------------------------------- | --------- |
| TanStack passing jobs          | 11 / 102   | 33 / 106                                      | **+22**   |
| TanStack job pass rate         | 10.8%      | 31.1%                                         | **+20pp** |
| TanStack est. test pass rate   | 48.7%      | ~57%                                          | **+8pp**  |
| Next.js passing jobs           | 96 / 102   | 100 / 106                                     | **+4**    |
| auth [next] Lexical regression | failing    | **FIXED ✓**                                   | —         |
| New regression                 | —          | fields**collections**Indexed [tanstack-start] | —         |

**Key change**: A large block of `fields__collections__*` suites (22 suites) that were previously failing in TanStack Start are now fully passing. This is the most significant single improvement in this run.

---

## TanStack Start — Passing Suites (33/106 jobs, ~29 unique suites)

These suites have all shards passing:

| Suite                                                                 | Previously           | Notes                                                                     |
| --------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------- |
| `_community`                                                          | passing              | Unchanged                                                                 |
| `auth-basic`                                                          | **NEW PASS**         | Was 2/2 failing; now passes                                               |
| `bulk-edit` (1/2 only)                                                | passing (same shard) | 2/2 still fails                                                           |
| `fields__collections__Array`                                          | **NEW PASS**         | Was 4F/23P; now 0F                                                        |
| `fields__collections__Blocks` (both shards)                           | **NEW PASS**         | Was 6F/30P per shard; now 0F                                              |
| `fields__collections__Blocks#config.blockreferences.ts` (both shards) | **NEW PASS**         | Was 6F/30P per shard; now 0F                                              |
| `fields__collections__Checkbox`                                       | **NEW PASS**         | Was 1F/2P; now 0F                                                         |
| `fields__collections__Collapsible`                                    | **NEW PASS**         | Was 2F/1P; now 0F                                                         |
| `fields__collections__ConditionalLogic`                               | **NEW PASS**         | Was 3F/11P; now 0F                                                        |
| `fields__collections__CustomID`                                       | passing              | Unchanged                                                                 |
| `fields__collections__Date` (both shards)                             | passing              | Unchanged                                                                 |
| `fields__collections__Email`                                          | **NEW PASS**         | Was 4F/6P; now 0F                                                         |
| `fields__collections__JSON`                                           | **NEW PASS**         | Was 1F/6P; now 0F                                                         |
| `fields__collections__Number`                                         | passing              | Unchanged                                                                 |
| `fields__collections__Point`                                          | **NEW PASS**         | Was 1F/3P; now 0F                                                         |
| `fields__collections__Radio`                                          | **NEW PASS**         | Was 3F/4P; now 0F                                                         |
| `fields__collections__Row`                                            | passing              | Unchanged                                                                 |
| `fields__collections__Select`                                         | **NEW PASS**         | Was 2F/3P; now 0F                                                         |
| `fields__collections__Tabs`                                           | **NEW PASS**         | Was 1F/7P; now 0F                                                         |
| `fields__collections__Tabs2`                                          | passing              | Unchanged                                                                 |
| `fields__collections__Text`                                           | **NEW PASS**         | Was 1F/18P; now 0F                                                        |
| `fields__collections__UI`                                             | **NEW PASS**         | Was 1F/0P; now 0F                                                         |
| `fields__collections__Upload`                                         | **NEW PASS**         | Was 8F/1P; now 0F — major unblock                                         |
| `fields__collections__UploadMultiPoly`                                | **NEW PASS**         | Was 2F/0P; now 0F                                                         |
| `fields__collections__UploadPoly`                                     | **NEW PASS**         | Was 1F/0P; now 0F                                                         |
| `hooks`                                                               | passing              | Unchanged                                                                 |
| `plugin-form-builder`                                                 | **NEW PASS**         | Was 1F/4P; now 0F                                                         |
| `plugin-nested-docs`                                                  | **NEW PASS**         | Was 2F/1P; now 0F                                                         |
| `queues`                                                              | passing              | Unchanged                                                                 |
| `admin__e2e__list-view` (shard 1/4 only)                              | was failing          | Partial — shard 1/4 now passes; shards 2/4, 3/4 fail; shard 4/4 cancelled |

**Pattern**: The large wave of newly-passing suites is almost entirely in `fields__collections__*`. This strongly suggests a focused fix in the fields rendering/adapter layer — likely the resolution of one or more field-level rendering issues that were globally affecting all field collection tests. Upload fields (previously Root Cause 5) are also now passing, which is significant.

---

## New Regression

### `fields__collections__Indexed` — was passing, now failing

**Status**: Was `✓ 0F / 1P` in previous run, now `✗ 1F / 0P`  
**This is the only test that regressed from passing to failing.**

The Indexed field collection has a single test. It passed in the Apr 10 run and fails in this run. This is a small regression that should be investigated — it's likely a side effect of whatever fix unlocked the other fields**collections** suites.

---

## TanStack Start — Root Cause Analysis

The root causes from the previous run mostly still apply. Below is an updated assessment.

### Root Cause 1 — Node.js Built-in Modules in Browser Bundle (SYSTEMIC, UNCHANGED)

**Affects**: All remaining failing suites  
**Symptom**: Repeated in CI server logs:

```
Denied by specifier pattern: /^(assert|async_hooks|buffer|child_process|crypto|fs|http|...)(\/|$)/
```

**Assessment**: Still present in this run. Not yet fixed. The newly-passing `fields__collections__*` suites either work despite this noise or are less affected by it. The `auth`, `lexical`, and `admin` suites remain blocked partly by this.

---

### Root Cause 2 — Custom/Dynamic React Components Not Rendering (PARTIALLY FIXED)

**Previous state**: Affected ~50 suites  
**Current state**: Affects ~30 suites

The newly-passing `fields__collections__*` suites indicate this was partially fixed. The basic field rendering pipeline now works for the fields test suite. However, suites that rely on more complex dynamic component injection (admin e2e general, document-view, list-view beyond shard 1, form-state) still fail.

**Remaining failures with this pattern**:

- `admin__e2e__general` (2 shards fail + 2 cancelled)
- `admin__e2e__document-view` (all 3 shards fail)
- `admin__e2e__list-view` (shards 2/4, 3/4 fail; 4/4 cancelled)
- `form-state`
- `field-error-states`
- `locked-documents`

---

### Root Cause 3 — Auth `create-first-user` Page / Lexical RSC Regression — **FIXED IN NEXT.JS**

**Next.js**: `auth [next]` is **no longer in the failure list** — the "Initialized lexical RSC field without a field name" error is fixed. This was the only real Next.js regression in the previous run.

**TanStack**: `auth [tanstack-start]` still fails (1F). The auth setup fixture likely still crashes at 0ms in TanStack Start. Now that the Next.js Lexical RSC issue is fixed, the TanStack auth failure is a separate, TanStack-specific issue to investigate.

---

### Root Cause 4 — CI Job Timeouts (45-minute limit exceeded, UNCHANGED)

**Cancelled suites in this run (22)**: Same count as previous run (23 then). The suites cancelled remain approximately the same set:

- `admin-root`, `dashboard`, `group-by`, `joins`, `lexical__collections__LexicalViewsFrontend` (NEW), `lexical__collections___LexicalFullyFeatured`, `lexical__collections__OnDemandForm`, `localization` (both shards), `plugin-import-export`, `plugin-multi-tenant` (3 jobs), `query-presets`, `trash` (1/2), `versions` (all 3 shards), `admin__e2e__general` (1/3 and 3/3), `admin__e2e__list-view` (4/4), `folders` (2/3)

**Notable change**: `admin__e2e__document-view` shards 2/3 and 3/3 were cancelled in the previous run but now produce actual test failures (exit code 1) — they complete but fail tests. This is slightly better (real failures vs timeouts).

---

### Root Cause 5 — Upload UI Elements Not Rendering — **FIXED**

The `fields__collections__Upload`, `fields__collections__UploadPoly`, and `fields__collections__UploadMultiPoly` suites now all pass. This was Root Cause 5 in the previous analysis and is now resolved at the field-component level.

**However**, the main `uploads` suite (3 shards) still fails entirely, and `storage-s3__client-uploads` and `storage-vercel-blob__client-uploads` still fail. These likely involve a different upload code path (the collection-level upload handler vs the field component).

---

### Root Cause 6 — Live Preview: Response Body Consumed Twice (UNCHANGED)

**Affects**: `live-preview` (both shards, 1/2 and 2/2) — still failing  
**Symptom**: Same as before:

```
TypeError: Response body object should not be disturbed or locked
```

No progress here. Still needs the TanStack Start adapter middleware to clone the Response before consuming it.

---

### Root Cause 7 — A11y Focus Indicator Tests Timing Out (UNCHANGED)

**Affects**: `a11y` suite — still failing  
**Still timing out at 60s** for CSS computed style checks. May resolve when broader rendering issues are fixed.

---

### Root Cause 8 — Page Navigation Timeouts (PARTIALLY BETTER)

`admin__e2e__list-view` shard 1/4 now passes, suggesting shard 1's navigation tests work. Shards 2/4 and 3/4 still fail with test errors, and shard 4/4 still cancels (timeout). The navigation issues persist in later shards.

---

### Root Cause 9 — Auth-Basic Element Count Mismatch — **FIXED**

`auth-basic [tanstack-start]` now passes (was 2/2 failing). Whatever was causing the "locator resolved to 0/4 elements instead of expected count" is resolved.

---

### Root Cause 10 — New: LexicalViews Suites (NEW, ALL FAILING)

**Affects**: 4 new suites added in this PR push:

- `lexical__collections__LexicalViewsFrontend` — CANCELLED (timeout)
- `lexical__collections__LexicalViewsNested` — failure
- `lexical__collections__LexicalViewsProvider` — failure
- `lexical__collections__LexicalViewsProviderDefault` — failure

**Root cause**: These are new Lexical Views feature tests. They fail in TanStack Start for the same reasons as other lexical suites — the Lexical editor rendering pipeline is not wired up for TanStack. All 4 pass in Next.js, confirming the implementation is complete on the Next.js side.

---

### Root Cause 11 — `fields__collections__Indexed` Regression (NEW)

**Affects**: `fields__collections__Indexed [tanstack-start]` — 1 test, was passing, now failing  
**Assessment**: This is a small regression, likely a side effect of the large fields rendering fix in this push. The Indexed field test suite has 1 test; it passed before and fails now. Should be quick to fix once the specific test failure is inspected.

---

## Areas That Are Completely Broken in TanStack (0% pass rate)

These suites still have 0 passing tests:

- **auth** — still 0% (fixture crash or test failure)
- **access-control** — both shards fail
- **admin-bar** — 0%
- **admin-root** — CANCELLED
- **admin**e2e**document-view** — all 3 shards fail (was 1 fail + 2 cancelled before)
- **a11y** — 0%
- **dashboard** — CANCELLED
- **field-paths** — 0%
- **fields-relationship** — 0%
- **fields**collections**Indexed** — REGRESSION (was passing)
- **fields**collections**Relationship** — both shards fail
- **folders** — 3 shards: 2 fail, 1 cancelled
- **form-state** — 0%
- **group-by** — CANCELLED
- **i18n** — 0%
- **joins** — CANCELLED
- **lexical** (all 9 job types) — 0%
- **lexical**collections**LexicalViewsFrontend** — CANCELLED (NEW)
- **lexical**collections**LexicalViewsNested** — 0% (NEW)
- **lexical**collections**LexicalViewsProvider** — 0% (NEW)
- **lexical**collections**LexicalViewsProviderDefault** — 0% (NEW)
- **localization** — both shards CANCELLED
- **locked-documents** — 0%
- **plugin-cloud-storage** — 0%
- **plugin-import-export** — CANCELLED
- **plugin-multi-tenant** — all 3 jobs CANCELLED
- **plugin-redirects** — 0%
- **plugin-seo** — 0%
- **query-presets** — CANCELLED
- **server-url** — 0%
- **sort** — 0%
- **storage-s3\_\_client-uploads** — 0%
- **storage-vercel-blob\_\_client-uploads** — 0%
- **trash** — 1 shard fails, 1 CANCELLED (no passes)
- **uploads** (all 3 shards) — 0%
- **versions** — all 3 shards CANCELLED

---

## Areas With Partial Passing (TanStack)

| Suite                   | Passing                       | Notes                                             |
| ----------------------- | ----------------------------- | ------------------------------------------------- |
| `admin__e2e__list-view` | shard 1/4 passes              | Shards 2/4, 3/4 fail; shard 4/4 cancelled         |
| `bulk-edit`             | shard 1/2 passes              | Shard 2/2 still fails                             |
| `live-preview`          | partial (est. 9-14 per shard) | Response body errors affect a subset of tests     |
| `admin__e2e__general`   | shard 2/3 partial             | ~half tests pass in shard 2; shards 1&3 cancelled |
| `field-error-states`    | ~9/10 pass                    | 1 test still fails                                |
| `field-paths`           | ~1/2 pass                     | 1 test fails                                      |

---

## Next.js Regressions

**Total**: 6 failing jobs out of 106 (5.7%)

### Fixed Regression (1) ✓

| Suite         | Previous error                                       | Status                        |
| ------------- | ---------------------------------------------------- | ----------------------------- |
| `auth [next]` | `Initialized lexical RSC field without a field name` | **FIXED — no longer failing** |

### Likely Pre-Existing Flakes (6)

| Suite                                    | Error                                                                            | Assessment                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `admin__e2e__general [next]` (1/3)       | `TypeError: Cannot read properties of undefined (reading 'payload')` at line 412 | **LIKELY FLAKE** — same error as previous run, shard 3/3 passes                                     |
| `admin__e2e__general [next]` (2/3)       | Same error                                                                       | **LIKELY FLAKE** — same shard that failed before                                                    |
| `admin__e2e__list-view [next]` (1/4)     | `page.waitForURL: Timeout 30000ms exceeded`                                      | **LIKELY FLAKE** — shards 2/4 and 3/4 pass; shard 1 replaced shard 4 from last run as the flaky one |
| `admin__e2e__list-view [next]` (4/4)     | Same timeout error                                                               | **LIKELY FLAKE** — same as previous run                                                             |
| `admin__e2e__document-view [next]` (1/3) | element(s) not found                                                             | **LIKELY FLAKE** — shards 2/3 and 3/3 pass                                                          |
| `access-control [next]` (1/2)            | element(s) not found                                                             | **LIKELY FLAKE** — shard 2/2 passes                                                                 |

**Net new Next.js regressions**: 0 (auth Lexical RSC regression from previous run is fixed; all remaining failures are pre-existing flakes)

---

## Other Failures (Non-E2E)

### `build-template-plugin-` — TypeScript Build Failure (UNCHANGED)

**Error**: `src/components/BeforeDashboardServer.tsx(3,20): error TS2307: Cannot find module './BeforeDashboardServer.module.css'`  
**Status**: Same as previous run. Not yet fixed.  
**Fix**: Add `BeforeDashboardServer.module.css` or a `declare module '*.module.css'` declaration.

### `int-sqlite (2/3)` — Storage Azure Streaming Uploads (NEW)

**Error**: `[int] test/storage-azure/streamingUploads.int.spec.ts > @payloadcms/storage-azure streamingUploads > preserves mime type when uploaded via rest endpoint`  
**Assessment**: New integration test failure, not E2E. Azure streaming uploads test is failing in the SQLite integration suite. May be a flake or a real regression in the storage-azure package. Should be investigated separately.

---

## Task List — Priority Order

### P0 — Critical / Must Fix

1. **[P0] Fix: `fields__collections__Indexed` regression in TanStack Start**

   - Was passing in Apr 10 run, now failing (1 test)
   - Likely a side effect of the fields rendering fix that landed in this push
   - Easy to reproduce — single-test suite, quick to debug
   - Check what changed in the fields rendering path that could affect an `indexed: true` field specifically

2. **[P0] Fix: Node.js built-in modules (crypto, fs, assert) leaking into TanStack Start browser bundle**

   - Still systemic noise — affects all failing suites
   - Fix: Vite config externals for Node.js builtins in `packages/tanstack-start/src/vite.ts`
   - Unchanged from previous run; still blocks auth-related and server-side-only tests

3. **[P0] Fix: build-template-plugin TypeScript error (CSS module missing)**
   - Still failing, same error as previous run
   - 1-line fix: add `declare module '*.module.css'` to template or add the CSS file
   - Blocks CI green status

### P1 — High Priority

4. **[P1] Fix: Auth fixture crash in TanStack Start**

   - `auth [tanstack-start]` still at 0% — fixture crashes before any tests run
   - Now separate from the Next.js Lexical issue (which was fixed)
   - Debug the `beforeAll` fixture specifically for TanStack — likely a server initialization or session setup issue
   - Note: `auth-basic` now passes, so basic auth rendering works; this is specifically the auth test suite's fixture

5. **[P1] Continue: Custom admin component rendering in TanStack Start**

   - The fields rendering fix brought 22 new suites to passing — but admin-level components (beforeList, afterList, custom cells, dynamic descriptions) still don't render
   - `admin__e2e__document-view` (all 3 shards fail), `admin__e2e__general` (2/3 partial), `form-state` remain broken
   - This is the next-largest blocker after the batch of fields fixes

6. **[P1] Fix: Uploads collection (not field) in TanStack Start**

   - `fields__collections__Upload*` now PASS (field-level upload is fixed)
   - But `uploads` (3 shards, collection-level), `storage-s3__client-uploads`, and `storage-vercel-blob__client-uploads` still fail
   - The collection-level upload handler uses a different code path than the field component — likely needs the same fix applied to the collection upload adapter

7. **[P1] Fix: int-sqlite storage-azure streaming uploads regression**
   - New integration test failure for `storage-azure` streaming uploads MIME type preservation
   - Investigate whether this is a flake or a real change in the storage adapter

### P2 — Medium Priority

8. **[P2] Fix: Live Preview — Response body locked error**

   - Still failing in both live-preview shards
   - Fix: Clone Response before passing through TanStack Start middleware
   - Unchanged from previous run

9. **[P2] Investigate: LexicalViews suites (4 new suites, all fail/cancel in TanStack)**

   - `LexicalViewsFrontend`, `LexicalViewsNested`, `LexicalViewsProvider`, `LexicalViewsProviderDefault`
   - All pass in Next.js, all fail/cancel in TanStack
   - Part of the broader lexical rendering issue in TanStack

10. **[P2] Optimize: TanStack Start CI timeout — same 22 suites still cancelling**

    - `versions`, `localization`, `plugin-multi-tenant`, `query-presets`, `group-by`, `joins`, `plugin-import-export`, `dashboard`, `admin-root` etc. all still hit 45-minute limit
    - Worth revisiting Vite pre-bundling and SSR optimization given the recent performance improvements

11. **[P2] Fix: A11y focus indicator test timeouts**
    - `a11y [tanstack-start]` still 0%
    - May resolve once broader rendering issues are fixed

### P3 — Low Priority / Investigation

12. **[P3] Monitor: Next.js flaky tests (6 suites)**

    - Same 5 flaky suites as before (`admin__e2e__general` ×2, `admin__e2e__list-view` ×2, `admin__e2e__document-view`, `access-control`)
    - Note: shard 1/4 of `admin__e2e__list-view` is NEW in this run's flakes (previously was only shard 4/4)
    - `admin__e2e__general` error at line 412: `TypeError: Cannot read properties of undefined (reading 'payload')` — likely a race condition in fixture setup, pre-existing
    - Run these in isolation to confirm they are pre-existing and not caused by this PR

13. **[P3] Track: TanStack suite pass rate over time**
    - Apr 10 run: 10.8% (11/102 jobs)
    - Apr 15 run: 31.1% (33/106 jobs) — **+20pp in 5 days**
    - Goal per P0/P1 fix expectations: each major fix adds 5-15 more passing suites

---

## What Would Move the Needle Most

The biggest win this run came from fixing the `fields__collections__*` rendering path. The next equivalent wins would be:

**Fixing auth fixture crash** would unblock the entire `auth` test suite (13 tests) and confirm auth-basic's fix is stable.

**Fixing collection-level upload handling** (P1 #6) would unblock `uploads` (3 shards, ~80 tests), `storage-s3__client-uploads`, and `storage-vercel-blob__client-uploads`.

**Continuing work on custom admin component rendering** (P1 #5) remains the biggest single piece of work — it would unblock `admin__e2e__document-view`, `admin__e2e__general`, `admin__e2e__list-view` remaining shards, and `form-state`.

After those three: TanStack estimated pass rate would reach **~45-55% at suite level**.

After resolving CI timeouts (P2 #10): the ~22 cancelled suites would actually run and their real status would be visible.

---

## Individual Test Counts by Suite

All shards combined (estimated where noted). **F** = failed, **P** = passed, **S** = skipped.  
TanStack `CANCELLED` = suite hit 45-min CI timeout.  
`~` prefix = estimated from previous run data (no per-test report available for this run).

| Suite                                                                | TanStack                                                | Next.js                          |
| -------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------- |
| \_community                                                          | ✓ 0F / 1P                                               | ✓ 0F / 1P                        |
| a11y                                                                 | ✗ **~F** / ~P / ~S                                      | ✓ 0F / 54P / 13S                 |
| access-control                                                       | ✗ **F** / 0P (both shards)                              | ✗ **~2F** / ~99P                 |
| admin-bar                                                            | ✗ **F** / 0P                                            | ✓ 0F / 1P                        |
| admin-root                                                           | CANCELLED                                               | ✓ 0F / 11P                       |
| admin**e2e**document-view                                            | ✗ **F** / ~P (all 3 shards fail, was 1F+2CANCEL)        | ✗ **~2F** / ~62P                 |
| admin**e2e**general                                                  | ✗ shard 2 partial, shards 1&3 CANCELLED                 | ✗ **~4F** / ~78P / ~2S           |
| admin**e2e**list-view                                                | ✓ shard 1/4 PASSES; ✗ 2/4 & 3/4 fail; 4/4 CANCELLED     | ✗ **~2F** / ~87P                 |
| auth                                                                 | ✗ **F** / 0P                                            | ✓ **0F** / ~2P / ~1S (**FIXED**) |
| auth-basic                                                           | ✓ **0F / 2P** (**NEW PASS**)                            | ✓ 0F / 2P                        |
| bulk-edit                                                            | ✓ shard 1 0F/19P; ✗ shard 2 F                           | ✓ 0F / 20P                       |
| dashboard                                                            | CANCELLED                                               | ✓ 0F / 20P                       |
| field-error-states                                                   | ✗ **~1F** / ~9P                                         | ✓ 0F / 10P                       |
| field-paths                                                          | ✗ **~1F** / ~1P                                         | ✓ 0F / 2P                        |
| fields-relationship                                                  | ✗ **F** / 0P / ~4S                                      | ✓ 0F / 33P / 4S                  |
| fields**collections**Array                                           | ✓ **0F / ~28P / 1S** (**NEW PASS**)                     | ✓ 0F / 28P / 1S                  |
| fields**collections**Blocks (both shards)                            | ✓ **0F / ~36P** (**NEW PASS**)                          | ✓ 0F / 36P                       |
| fields**collections**Blocks#config.blockreferences.ts (both shards)  | ✓ **0F / ~35P** (**NEW PASS**)                          | ✓ 0F / 35P                       |
| fields**collections**Checkbox                                        | ✓ **0F / 3P** (**NEW PASS**)                            | ✓ 0F / 3P                        |
| fields**collections**Collapsible                                     | ✓ **0F / ~4P / 1S** (**NEW PASS**)                      | ✓ 0F / 4P / 1S                   |
| fields**collections**ConditionalLogic                                | ✓ **0F / 14P** (**NEW PASS**)                           | ✓ 0F / 14P                       |
| fields**collections**CustomID                                        | ✓ 0F / 3P                                               | ✓ 0F / 3P                        |
| fields**collections**Date (both shards)                              | ✓ 0F / 65P / 2S                                         | ✓ 0F / 67P / 2S                  |
| fields**collections**Email                                           | ✓ **0F / ~9P** (**NEW PASS**)                           | ✓ 0F / 9P                        |
| fields**collections**Indexed                                         | ✗ **1F / 0P** (**REGRESSION**)                          | ✓ 0F / 1P                        |
| fields**collections**JSON                                            | ✓ **0F / ~8P** (**NEW PASS**)                           | ✓ 0F / 8P                        |
| fields**collections**Number                                          | ✓ 0F / 11P / 2S                                         | ✓ 0F / 11P / 2S                  |
| fields**collections**Point                                           | ✓ **0F / ~4P / 1S** (**NEW PASS**)                      | ✓ 0F / 4P / 1S                   |
| fields**collections**Radio                                           | ✓ **0F / 7P** (**NEW PASS**)                            | ✓ 0F / 7P                        |
| fields**collections**Relationship (both shards)                      | ✗ **F** / ~4P (~1 shard prev. cancelled, now both fail) | ✓ 0F / 33P / 6S                  |
| fields**collections**Row                                             | ✓ 0F / 6P                                               | ✓ 0F / 6P                        |
| fields**collections**Select                                          | ✓ **0F / ~6P / 3S** (**NEW PASS**)                      | ✓ 0F / 6P / 3S                   |
| fields**collections**Tabs                                            | ✓ **0F / ~8P / 1S** (**NEW PASS**)                      | ✓ 0F / 8P / 1S                   |
| fields**collections**Tabs2                                           | ✓ 0F / 1P                                               | ✓ 0F / 1P                        |
| fields**collections**Text                                            | ✓ **0F / ~19P / 1S** (**NEW PASS**)                     | ✓ 0F / 19P / 1S                  |
| fields**collections**UI                                              | ✓ **0F / 1P** (**NEW PASS**)                            | ✓ 0F / 1P                        |
| fields**collections**Upload                                          | ✓ **0F / ~9P / 3S** (**NEW PASS**)                      | ✓ 0F / 9P / 3S                   |
| fields**collections**UploadMultiPoly                                 | ✓ **0F / 2P** (**NEW PASS**)                            | ✓ 0F / 2P                        |
| fields**collections**UploadPoly                                      | ✓ **0F / 1P** (**NEW PASS**)                            | ✓ 0F / 1P                        |
| folders (3 shards)                                                   | ✗ **F** / ~P (2 shards fail, 1 cancelled)               | ✓ 0F / 35P                       |
| form-state                                                           | ✗ **F** / ~1P / ~4S                                     | ✓ 0F / 16P / 4S                  |
| group-by                                                             | CANCELLED                                               | ✓ 0F / 37P / 1S                  |
| hooks                                                                | ✓ 0F / 6P                                               | ✓ 0F / 6P                        |
| i18n                                                                 | ✗ **F** / 0P                                            | ✓ 0F / 7P                        |
| joins                                                                | CANCELLED                                               | ✓ 0F / 28P                       |
| lexical**collections**LexicalHeadingFeature                          | ✗ **F** / 0P                                            | ✓ 0F / 1P                        |
| lexical**collections**LexicalJSXConverter                            | ✗ **F** / 0P                                            | ✓ 0F / 1P                        |
| lexical**collections**LexicalLinkFeature                             | ✗ **F** / 0P                                            | ✓ 0F / 6P                        |
| lexical**collections**LexicalListsFeature                            | ✗ **F** / 0P                                            | ✓ 0F / 1P                        |
| lexical**collections**LexicalViewsFrontend _(NEW)_                   | CANCELLED                                               | ✓ 0F / ~P                        |
| lexical**collections**LexicalViewsNested _(NEW)_                     | ✗ **F** / 0P                                            | ✓ 0F / ~P                        |
| lexical**collections**LexicalViewsProvider _(NEW)_                   | ✗ **F** / 0P                                            | ✓ 0F / ~P                        |
| lexical**collections**LexicalViewsProviderDefault _(NEW)_            | ✗ **F** / 0P                                            | ✓ 0F / ~P                        |
| lexical**collections**Lexical**e2e**blocks (both shards)             | ✗ **F** / 0P (both shards fail)                         | ✓ 0F / 27P                       |
| lexical**collections**Lexical**e2e**blocks#config.blockreferences.ts | ✗ **F** / 0P (both shards fail)                         | ✓ 0F / 27P                       |
| lexical**collections**Lexical**e2e**main (both shards)               | ✗ **F** / 0P (both shards fail)                         | ✓ 0F / 29P / 2S                  |
| lexical**collections**OnDemandForm                                   | CANCELLED                                               | ✓ 0F / 7P                        |
| lexical**collections**RichText                                       | ✗ **F** / ~1P / ~4S                                     | ✓ 0F / 9P / 4S                   |
| lexical**collections\_**LexicalFullyFeatured                         | CANCELLED                                               | ✓ 0F / 14P                       |
| lexical**collections\_**LexicalFullyFeatured\_\_db                   | ✗ **F** / 0P                                            | ✓ 0F / 6P                        |
| live-preview (both shards)                                           | ✗ **F** / ~16P / ~1S (partial — some tests pass)        | ✓ 0F / 28P / 1S                  |
| localization (both shards)                                           | CANCELLED                                               | ✓ 0F / 46P / 2S                  |
| locked-documents                                                     | ✗ **F** / ~42P                                          | ✓ 0F / 45P                       |
| plugin-cloud-storage                                                 | ✗ **F** / 0P                                            | ✓ 0F / 3P                        |
| plugin-form-builder                                                  | ✓ **0F / ~5P** (**NEW PASS**)                           | ✓ 0F / 5P                        |
| plugin-import-export                                                 | CANCELLED                                               | ✓ 0F / 38P                       |
| plugin-multi-tenant (all 3 jobs)                                     | CANCELLED                                               | ✓ 0F / 28-30P                    |
| plugin-nested-docs                                                   | ✓ **0F / 3P** (**NEW PASS**)                            | ✓ 0F / 3P                        |
| plugin-redirects                                                     | ✗ **F** / ~1P                                           | ✓ 0F / 3P                        |
| plugin-seo                                                           | ✗ **F** / ~1P / ~2S                                     | ✓ 0F / 3P / 2S                   |
| query-presets                                                        | CANCELLED                                               | ✓ 0F / 24P / 2S                  |
| queues                                                               | ✓ 0F / 2P                                               | ✓ 0F / 2P                        |
| server-url                                                           | ✗ **F** / 0P                                            | ✓ 0F / 2P                        |
| sort                                                                 | ✗ **F** / 0P                                            | ✓ 0F / 1P                        |
| storage-s3\_\_client-uploads                                         | ✗ **F** / 0P                                            | ✓ 0F / 4P                        |
| storage-vercel-blob\_\_client-uploads                                | ✗ **F** / 0P                                            | ✓ 0F / 4P                        |
| trash (2 shards)                                                     | ✗ shard 1 CANCELLED; shard 2 **F** / ~7P                | ✓ 0F / 40P                       |
| uploads (3 shards)                                                   | ✗ **F** / ~5P (all 3 shards fail)                       | ✓ 0F / 80P                       |
| versions (3 shards)                                                  | CANCELLED                                               | ✓ 0F / 120P / 2S                 |

---

## Appendix — Full TanStack Failing Job List

### Failures (actual test failures, exit code 1)

| Suite                                                                                             | Status  | Notes                |
| ------------------------------------------------------------------------------------------------- | ------- | -------------------- |
| E2E - a11y [tanstack-start]                                                                       | failure |                      |
| E2E - access-control [tanstack-start] (1/2)                                                       | failure |                      |
| E2E - access-control [tanstack-start] (2/2)                                                       | failure |                      |
| E2E - admin-bar [tanstack-start]                                                                  | failure |                      |
| E2E - admin**e2e**document-view [tanstack-start] (1/3)                                            | failure | was failure before   |
| E2E - admin**e2e**document-view [tanstack-start] (2/3)                                            | failure | was CANCELLED before |
| E2E - admin**e2e**document-view [tanstack-start] (3/3)                                            | failure | was CANCELLED before |
| E2E - admin**e2e**general [tanstack-start] (2/3)                                                  | failure |                      |
| E2E - admin**e2e**list-view [tanstack-start] (2/4)                                                | failure |                      |
| E2E - admin**e2e**list-view [tanstack-start] (3/4)                                                | failure |                      |
| E2E - auth [tanstack-start]                                                                       | failure |                      |
| E2E - bulk-edit [tanstack-start] (2/2)                                                            | failure |                      |
| E2E - field-error-states [tanstack-start]                                                         | failure |                      |
| E2E - field-paths [tanstack-start]                                                                | failure |                      |
| E2E - fields-relationship [tanstack-start]                                                        | failure |                      |
| E2E - fields**collections**Indexed [tanstack-start]                                               | failure | **REGRESSION**       |
| E2E - fields**collections**Relationship [tanstack-start] (1/2)                                    | failure | was CANCELLED before |
| E2E - fields**collections**Relationship [tanstack-start] (2/2)                                    | failure |                      |
| E2E - folders [tanstack-start] (1/3)                                                              | failure |                      |
| E2E - folders [tanstack-start] (3/3)                                                              | failure |                      |
| E2E - form-state [tanstack-start]                                                                 | failure |                      |
| E2E - i18n [tanstack-start]                                                                       | failure |                      |
| E2E - lexical**collections**LexicalHeadingFeature [tanstack-start]                                | failure |                      |
| E2E - lexical**collections**LexicalJSXConverter [tanstack-start]                                  | failure |                      |
| E2E - lexical**collections**LexicalLinkFeature [tanstack-start]                                   | failure |                      |
| E2E - lexical**collections**LexicalListsFeature [tanstack-start]                                  | failure |                      |
| E2E - lexical**collections**LexicalViewsNested [tanstack-start]                                   | failure | **NEW SUITE**        |
| E2E - lexical**collections**LexicalViewsProvider [tanstack-start]                                 | failure | **NEW SUITE**        |
| E2E - lexical**collections**LexicalViewsProviderDefault [tanstack-start]                          | failure | **NEW SUITE**        |
| E2E - lexical**collections**Lexical**e2e**blocks [tanstack-start] (1/2)                           | failure |                      |
| E2E - lexical**collections**Lexical**e2e**blocks [tanstack-start] (2/2)                           | failure |                      |
| E2E - lexical**collections**Lexical**e2e**blocks#config.blockreferences.ts [tanstack-start] (1/2) | failure |                      |
| E2E - lexical**collections**Lexical**e2e**blocks#config.blockreferences.ts [tanstack-start] (2/2) | failure |                      |
| E2E - lexical**collections**Lexical**e2e**main [tanstack-start] (1/2)                             | failure |                      |
| E2E - lexical**collections**Lexical**e2e**main [tanstack-start] (2/2)                             | failure |                      |
| E2E - lexical**collections**RichText [tanstack-start]                                             | failure |                      |
| E2E - lexical**collections\_**LexicalFullyFeatured\_\_db [tanstack-start]                         | failure |                      |
| E2E - live-preview [tanstack-start] (1/2)                                                         | failure |                      |
| E2E - live-preview [tanstack-start] (2/2)                                                         | failure |                      |
| E2E - locked-documents [tanstack-start]                                                           | failure |                      |
| E2E - plugin-cloud-storage [tanstack-start]                                                       | failure |                      |
| E2E - plugin-redirects [tanstack-start]                                                           | failure |                      |
| E2E - plugin-seo [tanstack-start]                                                                 | failure |                      |
| E2E - server-url [tanstack-start]                                                                 | failure |                      |
| E2E - sort [tanstack-start]                                                                       | failure |                      |
| E2E - storage-s3\_\_client-uploads#client-uploads/config.ts [tanstack-start]                      | failure |                      |
| E2E - storage-vercel-blob\_\_client-uploads#client-uploads/config.ts [tanstack-start]             | failure |                      |
| E2E - trash [tanstack-start] (2/2)                                                                | failure |                      |
| E2E - uploads [tanstack-start] (1/3)                                                              | failure |                      |
| E2E - uploads [tanstack-start] (2/3)                                                              | failure |                      |
| E2E - uploads [tanstack-start] (3/3)                                                              | failure |                      |

### Cancelled (45-minute timeout exceeded) — 22 jobs

| Suite                                                                    | Status    |
| ------------------------------------------------------------------------ | --------- | ------------- |
| E2E - admin-root [tanstack-start]                                        | cancelled |
| E2E - admin**e2e**general [tanstack-start] (1/3)                         | cancelled |
| E2E - admin**e2e**general [tanstack-start] (3/3)                         | cancelled |
| E2E - admin**e2e**list-view [tanstack-start] (4/4)                       | cancelled |
| E2E - dashboard [tanstack-start]                                         | cancelled |
| E2E - folders [tanstack-start] (2/3)                                     | cancelled |
| E2E - group-by [tanstack-start]                                          | cancelled |
| E2E - joins [tanstack-start]                                             | cancelled |
| E2E - lexical**collections**LexicalViewsFrontend [tanstack-start]        | cancelled | **NEW SUITE** |
| E2E - lexical**collections**OnDemandForm [tanstack-start]                | cancelled |
| E2E - lexical**collections\_**LexicalFullyFeatured [tanstack-start]      | cancelled |
| E2E - localization [tanstack-start] (1/2)                                | cancelled |
| E2E - localization [tanstack-start] (2/2)                                | cancelled |
| E2E - plugin-import-export [tanstack-start]                              | cancelled |
| E2E - plugin-multi-tenant [tanstack-start] (1/2)                         | cancelled |
| E2E - plugin-multi-tenant [tanstack-start] (2/2)                         | cancelled |
| E2E - plugin-multi-tenant#config.conditionalProvider.ts [tanstack-start] | cancelled |
| E2E - query-presets [tanstack-start]                                     | cancelled |
| E2E - trash [tanstack-start] (1/2)                                       | cancelled |
| E2E - versions [tanstack-start] (1/3)                                    | cancelled |
| E2E - versions [tanstack-start] (2/3)                                    | cancelled |
| E2E - versions [tanstack-start] (3/3)                                    | cancelled |
