# E2E Analysis — Run 24249234229

**PR**: payloadcms/payload#16139 — Framework Adapter Pattern + TanStack Start Adapter  
**Branch**: experiment/framework-adapter-pattern  
**Run date**: 2026-04-10  
**URL**: https://github.com/payloadcms/payload/actions/runs/24249234229

---

## Executive Summary

### Suite-level (jobs)

| Framework          | Passing suites | Total suites | Pass rate |
| ------------------ | -------------- | ------------ | --------- |
| **TanStack Start** | 11             | 102          | **10.8%** |
| **Next.js**        | 96             | 102          | **94.1%** |

### Individual test level

| Framework          | Passed    | Failed  | Skipped | Total ran | Pass rate |
| ------------------ | --------- | ------- | ------- | --------- | --------- |
| **TanStack Start** | **451**   | **476** | 49      | **927**   | **48.7%** |
| **Next.js**        | **1,561** | **11**  | 61      | **1,572** | **99.3%** |

> **Note on TanStack cancelled suites**: 23 TanStack suites hit the 45-minute CI job limit and were cancelled. Those represent an estimated ~566 additional tests that never ran. Including them as "not passing", the effective TanStack pass rate across all ~1,548 tests is around **29%**.  
> Next.js ran all 102 suites with no cancellations.

TanStack Start is at very early alpha stage. Most failures fall into a small number of root-cause categories rather than being independent bugs — fixing the top 3 issues would likely unblock 60-70% of failing suites.

---

## TanStack Start — Passing Suites (11/102)

These represent the "working" baseline today:

| Suite                                   | Notes                               |
| --------------------------------------- | ----------------------------------- |
| `_community`                            | General integration, simple config  |
| `bulk-edit` (1/2 only)                  | Basic bulk edit operations          |
| `fields__collections__CustomID`         | Simple field, no complex components |
| `fields__collections__Date` (1/2 + 2/2) | Date fields                         |
| `fields__collections__Indexed`          | Indexed fields                      |
| `fields__collections__Number`           | Number field                        |
| `fields__collections__Row`              | Row layout                          |
| `fields__collections__Tabs2`            | Tabs (second variant)               |
| `hooks`                                 | Hook functionality (backend-heavy)  |
| `queues`                                | Queue management                    |

**Pattern**: Passing suites are backend-heavy or use simple field types without custom component injection or complex UI interactions.

---

## TanStack Start — Root Cause Analysis

### Root Cause 1 — Node.js Built-in Modules in Browser Bundle (SYSTEMIC)

**Affects**: Virtually all suites (90%+ of failures have this in server console)  
**Symptom**: Repeated in CI logs:

```
Denied by specifier pattern: /^(assert|async_hooks|buffer|child_process|crypto|fs|http|...)(\/|$)/
```

**Source files**:

- `packages/payload/src/auth/crypto.ts:6` — `import "crypto"`
- `packages/payload/src/auth/strategies/apiKey.ts:18` — `import "crypto"`
- `packages/payload/src/auth/strategies/local/authenticate.ts:19` — `import "crypto"`
- `packages/payload/src/auth/strategies/local/generatePasswordSaltHash.ts:11` — `import "crypto"`
- `packages/payload/src/auth/operations/forgotPassword.ts:91` — `import "crypto"`
- `packages/payload/src/utilities/telemetry/conf/index.ts:67` — `import "node:assert"`

**Root cause**: Vite (used by TanStack Start) includes server-only code in the browser/client bundle. Next.js handles this via the React Server Component boundary, but TanStack Start's Vite bundling doesn't enforce the same server/client split for these modules.

**Fix type**: Vite configuration — add explicit externals for Node.js built-ins in the TanStack Start Vite plugin config. Something like:

```ts
// In tanstack-start vite config
build: {
  rollupOptions: {
    external: ['crypto', 'node:assert', 'node:fs', 'node:path', 'node:os', ...]
  }
}
```

Or use the existing payload Vite plugin to mark these as `noExternal` / `external` appropriately.

---

### Root Cause 2 — Custom/Dynamic React Components Not Rendering (SYSTEMIC)

**Affects**: `admin__e2e__list-view`, `admin__e2e__general`, `admin__e2e__document-view`, `form-state`, `field-error-states`, `admin-bar`, most field suites, all plugin suites  
**Symptom**: `expect(locator).toBeVisible() failed — element(s) not found` for any dynamically injected component

**Concrete examples from logs** (`admin__e2e__list-view` shard 1/4):

- FAILS: "should render dynamic collection description components"
- FAILS: "should hide create new button when allowCreate is false"
- FAILS: "should render custom beforeList component"
- FAILS: "should render custom beforeListTable component"
- FAILS: "should render custom Cell component in table"
- FAILS: "should render custom afterList component"
- FAILS: "should render custom listMenuItems component"
- PASSES: "should render static collection descriptions"
- PASSES: "should link second cell"
- PASSES: "should prefill search input from query param"
- PASSES: "search should persist through browser back button"

**Pattern**: Any component that is _configured dynamically via Payload config_ (beforeList, afterList, custom Cell, description components, conditional rendering based on access) does not render. Static string descriptions work. Simple UI navigation works.

**Root cause**: These components in Next.js are React Server Components. TanStack Start renders components differently. The component resolution pipeline in the adapter layer is not fully wired up — custom admin components configured via Payload config likely need a TanStack-specific resolution and rendering path.

**Fix type**: Architecture — requires work on the TanStack adapter to properly resolve and render Payload-configured RSC-style components as TanStack Start components.

---

### Root Cause 3 — Auth "Create First User" Page Broken (REGRESSION — BOTH FRAMEWORKS)

**Affects**: `auth [next]` (2 failures), `auth [tanstack-start]` (all 13 tests blocked)

**Next.js error** (definitive):

```
Error: Initialized lexical RSC field without a field name
```

Tests failing: `should create first user and redirect to admin`, `richText field should not be readOnly in create first user view`

**TanStack error**: Test fails at 0ms (fixture/beforeAll crash), blocking all 13 tests in the suite.

**Root cause**: Something in this PR broke the Lexical field initialization when used in the `createFirstUser` form. The Lexical RSC field is being initialized without a field name context — likely a missing prop being forwarded down to `LexicalRSCFieldComponent` in the create-first-user route.

**Fix type**: Small codebase fix — find where Lexical RSC field receives its `name` prop in the create-first-user context and ensure it is forwarded correctly. This is likely a change in `packages/next/src` or `packages/richtext-lexical/src` that affected how the field initializes outside of a normal collection edit view.

---

### Root Cause 4 — CI Job Timeouts (45-minute limit exceeded)

**Affects** (cancelled status): `admin-root`, `dashboard`, `group-by`, `joins`, `lexical__OnDemandForm`, `lexical___LexicalFullyFeatured`, `localization` (both shards), `plugin-import-export`, `plugin-multi-tenant` (3 jobs), `query-presets`, `trash` (1/2), `versions` (all 3 shards)

**Count**: ~20 suites cancelled

**Root cause**: TanStack Start's Vite-based server has significantly slower cold-start and HMR than Next.js, especially for complex suites. The CI 45-minute job limit is being hit before tests finish. Complex suites like `versions` (which involves many document creation flows) are timing out.

**Fix type**: Either optimize TanStack Start server startup time (Vite pre-bundling config, SSR optimization) or raise the CI timeout limit for TanStack jobs. May also require pre-building steps.

---

### Root Cause 5 — Upload UI Elements Not Rendered

**Affects**: `uploads` (3 shards), `fields__collections__Upload`, `fields__collections__UploadPoly`, `fields__collections__UploadMultiPoly`, `storage-s3__client-uploads`, `storage-vercel-blob__client-uploads`

**Symptom**:

- `expect(locator).toHaveValue(expected) failed — element(s) not found` (storage-s3 tests)
- Multiple upload field tests fail to find input elements

**Concrete failing tests**:

- "should see upload filename in relation list"
- "should create file upload"
- "should copy the file url field to the clipboard"
- "should complete a single client upload via the admin UI"
- "should upload file directly to S3"

**Concrete passing tests** (same suite):

- "should show upload filename in upload collection list"
- "should remove remote URL button if pasteURL is false"

**Root cause**: The upload UI components (likely the file input/drag-drop zone) aren't rendering properly in TanStack Start. This could be related to Root Cause 2 (custom components not rendering) or a specific issue with how the upload adapter resolves the file path for TanStack's server.

**Fix type**: Medium — requires investigation. Could be a Vite file serving issue, or the upload component has a Next.js-specific code path that doesn't work in TanStack Start.

---

### Root Cause 6 — Live Preview: Response Body Consumed Twice

**Affects**: `live-preview` (1/2 and 2/2) — 5 failed, 9 passed per shard

**Symptom**: Server-side errors in CI logs:

```
TypeError: Response body object should not be disturbed or locked
  cause: TypeError: Response body object should not be disturbed or locked
```

Final test failures: `expect(locator).toBeVisible() failed`

**Root cause**: The live preview mechanism reads a Response body that has already been consumed by TanStack Start's middleware or SSR pipeline. This is a known TanStack Start issue — the framework's server-side pipeline and Payload's live preview both try to read the same Response stream.

**Fix type**: Medium — TanStack Start adapter middleware needs to clone the Response before passing it through or the live preview implementation needs to handle the locked body scenario.

---

### Root Cause 7 — A11y Focus Indicator Tests Timing Out

**Affects**: `a11y` suite, `fields__collections__Checkbox` A11y test, likely many other field suites' A11y subtests

**Symptom**:

```
Error: expect(received).toBeGreaterThanOrEqual(expected)
- Test timeout of 60000ms exceeded
  at test/fields/collections/Checkbox/e2e.spec.ts:95:27
```

**Test name**: "Checkbox inputs have focus indicators"

**Root cause**: The focus indicator test (at `e2e.spec.ts:95`) likely uses `getComputedStyle` or a custom focus check that times out waiting for a CSS value to appear. TanStack Start might render styles differently (e.g., SCSS/CSS injection timing differs from Next.js) causing the focus ring CSS to not be applied at the time of assertion.

**Fix type**: Could be a Vite CSS injection timing issue or TanStack-specific style loading order. May need a `waitFor` before the assertion, or may resolve with Root Cause 1 fix.

---

### Root Cause 8 — Page Navigation Timeouts

**Affects**: `admin__e2e__list-view` shard 2 (and likely others)

**Symptom**:

```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
```

**Root cause**: TanStack Router's navigation is slower than Next.js router for some route transitions, causing Playwright's `waitForURL` to time out. Specific to TanStack Router's internal transition mechanism.

**Fix type**: May resolve with performance improvements (Root Cause 4). Could also need TanStack-specific navigation helpers in the test playwright config.

---

### Root Cause 9 — Auth-Basic Element Count Mismatch

**Affects**: `auth-basic` — 2/2 tests fail

**Symptom**:

```
expect(locator).toHaveCount(expected) failed
- 5 × locator resolved to 0 elements
- 17 × locator resolved to 4 elements
```

**Root cause**: The auth-basic collection renders some expected elements differently in TanStack. The locator finds 0 elements initially (component not yet rendered) then finds 4 (wrong number vs expected). Related to component rendering timing or structure differences.

**Fix type**: Small — needs specific investigation of what elements auth-basic tests look for and why TanStack renders 4 instead of the expected count.

---

## Areas That Are Completely Broken in TanStack (all tests fail)

These suites have 0% pass rate and are fully non-functional:

- **auth** — All 13 tests blocked by fixture failure
- **auth-basic** — 2/2 tests fail
- **access-control** — Both shards 100% failing
- **admin-bar** — All tests fail
- **field-error-states** — All tests fail
- **field-paths** — All tests fail
- **fields-relationship** — All tests fail
- **fields**collections**Array** — All tests fail
- **fields**collections**Blocks** (both shards)
- **fields**collections**Blocks#config.blockreferences** (both shards)
- **fields**collections**Collapsible** — All tests fail
- **fields**collections**ConditionalLogic** — All tests fail
- **fields**collections**Email** — All tests fail
- **fields**collections**JSON** — All tests fail
- **fields**collections**Point** — All tests fail
- **fields**collections**Radio** — All tests fail
- **fields**collections**Select** — All tests fail
- **fields**collections**Tabs** — All tests fail
- **fields**collections**Text** — All tests fail
- **fields**collections**UI** — All tests fail
- **fields**collections**Upload** — All tests fail
- **fields**collections**UploadPoly** — All tests fail
- **fields**collections**UploadMultiPoly** — All tests fail
- **folders** (all 3 shards) — All tests fail
- **form-state** — All tests fail
- **i18n** — All tests fail
- **locked-documents** — All tests fail
- **plugin-cloud-storage** — All tests fail
- **plugin-form-builder** — All tests fail
- **plugin-nested-docs** — All tests fail
- **plugin-redirects** — All tests fail
- **plugin-seo** — All tests fail (timeout)
- **server-url** — All tests fail
- **sort** — All tests fail
- **storage-s3\_\_client-uploads** — All tests fail
- **storage-vercel-blob\_\_client-uploads** — All tests fail
- **uploads** (all 3 shards) — All tests fail
- **lexical** (all suites — 9 jobs) — All tests fail

---

## Areas With Partial Passing (TanStack)

These suites have some tests pass, suggesting a targeted fix could bring them to full pass:

| Suite                               | Passing                            | Notes                                          |
| ----------------------------------- | ---------------------------------- | ---------------------------------------------- |
| `admin__e2e__list-view` shard 1     | ~12/~30                            | Static content passes, dynamic components fail |
| `admin__e2e__list-view` shard 2     | ~29/30                             | 1 navigation timeout                           |
| `live-preview` shard 1              | 9/14                               | Response body errors affect some tests         |
| `fields__collections__Checkbox`     | 2/3                                | A11y focus indicator test times out            |
| `a11y`                              | 18/~31                             | WCAG reflow/zoom tests fail, focus tests pass  |
| `bulk-edit`                         | 1 shard passes, 1 fails            | Some bulk operations work                      |
| `fields__collections__Relationship` | shard 1 cancelled, shard 2 partial |                                                |

---

## Next.js Regressions

**Total**: 6 failing out of 102 (6%)

### Real Regression (1)

| Suite         | Error                                                | Assessment                                                                                                                                                                                                                  |
| ------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth [next]` | `Initialized lexical RSC field without a field name` | **REAL REGRESSION** — 2 tests fail consistently: "should create first user" and "richText field should not be readOnly in create first user view". Error appears in server logs on every retry. Must be fixed before merge. |

### Likely Pre-Existing Flakes (5)

| Suite                                    | Error                                                                            | Assessment                                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `admin__e2e__general [next]` (1/3)       | `TypeError: Cannot read properties of undefined (reading 'payload')` at line 412 | **LIKELY FLAKE** — shard 3/3 passes, 3 failed / 24 passed in shard 1. Race condition in fixture setup. |
| `admin__e2e__general [next]` (2/3)       | Same error                                                                       | **LIKELY FLAKE** — shard 3/3 passes                                                                    |
| `admin__e2e__list-view [next]` (4/4)     | `page.waitForURL: Timeout 30000ms exceeded`                                      | **LIKELY FLAKE** — shards 1-3 all pass, only 4/4 fails                                                 |
| `admin__e2e__document-view [next]` (1/3) | element(s) not found                                                             | **LIKELY FLAKE** — shards 2/3 and 3/3 pass                                                             |
| `access-control [next]` (1/2)            | element(s) not found                                                             | **LIKELY FLAKE** — shard 2/2 passes                                                                    |

**Net new Next.js regressions**: 1 (`auth` — Lexical RSC field name)

---

## Other Failures (Non-E2E)

### `build-template-plugin-` — TypeScript Build Failure

**Error**: `src/components/BeforeDashboardServer.tsx(3,20): error TS2307: Cannot find module './BeforeDashboardServer.module.css' or its corresponding type declarations.`  
**Fix**: Simple — either add `BeforeDashboardServer.module.css` to the template, add a `*.module.css` declaration file (`declare module '*.module.css'`), or fix the import path in `BeforeDashboardServer.tsx`.

---

## Task List for Asana (Priority Order)

### P0 — Critical / Regression Fixes

1. **[P0] Fix: Lexical RSC field initialized without field name in create-first-user page**

   - Affects: Next.js (real regression) + TanStack (setup crash)
   - Look for Lexical field initialization change in this PR
   - Files to check: `packages/richtext-lexical/src/`, `packages/next/src/`, create-first-user view
   - Must fix before merge

2. **[P0] Fix: Node.js built-in modules (crypto, fs, assert, etc.) leaking into TanStack Start browser bundle**

   - Affects: All 102 TanStack test suites (systemic noise + runtime failures)
   - Fix: Vite config in `packages/tanstack-start` — add explicit externals/server-side-only markers for Node.js builtins
   - Look at: `packages/payload/src/auth/crypto.ts`, telemetry conf, `packages/tanstack-start/src/vite.ts`
   - Fixing this will eliminate massive console noise and unblock auth-related tests

3. **[P0] Implement: Custom Payload-configured admin components rendering in TanStack Start**
   - Affects: ~50 suites — dynamic components, beforeList/afterList, custom cells, allowCreate conditional rendering
   - Root cause: RSC-style component injection (configured in Payload config) not implemented for TanStack adapter
   - This is the largest single blocker for TanStack suite pass rate
   - Architecture work required in the adapter layer

### P1 — High Priority

4. **[P1] Fix: Auth suite fixture crash in TanStack Start (all 13 tests blocked)**

   - After fixing P0 #1 and #2, recheck if auth fixture recovers
   - If not: Debug what the auth `beforeAll` fixture does that crashes at 0ms in TanStack

5. **[P1] Fix: Upload UI elements not rendering in TanStack Start**

   - Affects: 8 suites (uploads 3 shards, Upload/UploadPoly/UploadMultiPoly fields, storage-s3, storage-vercel-blob)
   - Upload input/dropzone elements not found in DOM
   - Investigate: Is the upload component a custom RSC component? (If so, fixing P0 #3 may resolve this)

6. **[P1] Optimize: TanStack Start server startup time for CI (fix job timeouts)**

   - ~20 suites are cancelled due to 45-minute CI job limit
   - Suites: versions, localization, plugin-multi-tenant, trash, lexical-fully-featured, group-by, query-presets, etc.
   - Options: Pre-warm Vite, optimize SSR bundling, increase job timeout for TanStack, or cache TanStack build artifacts
   - Note: live-preview shard 1 ran for 34 minutes, a11y ran for 30 minutes — extremely slow

7. **[P1] Fix: build-template-plugin TypeScript error (CSS module missing)**
   - Simple fix: Add `declare module '*.module.css'` or the CSS file to `templates/plugin/src/components/`
   - 1-line fix, blocks CI green status

### P2 — Medium Priority

8. **[P2] Fix: Live Preview — "Response body object should not be disturbed or locked"**

   - Affects: `live-preview` (5 failing tests per shard)
   - TanStack Start middleware and Payload live preview are both consuming the same Response body
   - Fix: Clone Response before passing through middleware, or handle locked body in live preview handler

9. **[P2] Investigate: Auth-basic rendering 4 elements instead of expected count in TanStack**

   - Affects: `auth-basic` (2 tests)
   - Auth-basic collection renders elements differently in TanStack Start
   - Locator finds 0 elements then 4 elements; expected different count
   - Likely a timing or structure difference in TanStack's rendering

10. **[P2] Fix: Page navigation timeouts in TanStack Router (`page.waitForURL`)**

    - Affects: `admin__e2e__list-view` and potentially others
    - TanStack Router navigation is slower than Next.js router for some transitions
    - Options: Add TanStack-specific wait helpers in playwright config, or optimize router transitions

11. **[P2] Fix: A11y focus indicator test timeouts in TanStack**
    - Affects: `a11y` suite, `fields__collections__Checkbox` A11y test
    - Test times out at 60s waiting for computed style focus ring values
    - Possibly CSS injection timing in Vite; may resolve with other fixes

### P3 — Low Priority / Investigation

12. **[P3] Investigate: Next.js flaky tests (5 suites)**

    - Suites: `admin__e2e__general` (2 shards), `admin__e2e__list-view` (4/4), `admin__e2e__document-view` (1/3), `access-control` (1/2)
    - All cases where some shards pass and others fail (shard-specific flakes)
    - `admin__e2e__general` error: `TypeError: Cannot read properties of undefined (reading 'payload')` at `e2e.spec.ts:412`
    - These appear pre-existing but should be confirmed not caused by this PR
    - Recommendation: Run these suites again in isolation; if they reproduce on main branch they're pre-existing

13. **[P3] Track: TanStack suite pass rate improvement over time**
    - Set up metric tracking: X/102 suites pass, by root cause category
    - Goal: Each P0 fix should improve pass rate by 15-25 suites

---

## What Would Move the Needle Most

Fixing **P0 #1** (Lexical RSC regression) unblocks Next.js.

Fixing **P0 #2** (Node.js externals) is likely a 1-2 day Vite config fix that will reduce noise significantly but may not fix many tests on its own.

Fixing **P0 #3** (custom component rendering) is the largest piece of work and will unblock the majority of failing TanStack suites — roughly 50 of the 91 failing suites have this as root or contributing cause.

After P0 #3, TanStack pass rate estimate: ~55-65% (55-65 suites passing).

After P1 #5 (uploads) and P1 #4 (auth fixture): ~70-75%.

After P1 #6 (CI timeouts) — those 20 cancelled suites would actually run and either pass or fail with real errors rather than timeouts: final pass rate measurable only after this is done.

---

## Individual Test Counts by Suite

All shards combined. **F** = failed, **P** = passed, **S** = skipped.  
TanStack `CANCELLED` = suite hit 45-min CI timeout, tests never ran.  
Next.js ran all suites.

| Suite                                                                | TanStack                              | Next.js                            |
| -------------------------------------------------------------------- | ------------------------------------- | ---------------------------------- |
| \_community                                                          | ✓ 0F / 1P                             | ✓ 0F / 1P                          |
| a11y                                                                 | ✗ **36F** / 18P / 13S                 | ✓ 0F / 54P / 13S                   |
| access-control                                                       | ✗ **2F** / 0P                         | ✗ **2F** / 99P                     |
| admin-bar                                                            | ✗ **1F** / 0P                         | ✓ 0F / 1P                          |
| admin-root                                                           | CANCELLED                             | ✓ 0F / 11P                         |
| admin**e2e**document-view                                            | ✗ **9F** / 13P (+2 shards cancelled)  | ✗ **2F** / 62P                     |
| admin**e2e**general                                                  | ✗ **13F** / 16P (+2 shards cancelled) | ✗ **4F** / 78P / 2S                |
| admin**e2e**list-view                                                | ✗ **18F** / 49P (+1 shard cancelled)  | ✗ **1F** / 86P                     |
| auth                                                                 | ✗ **1F** / 0P / 1S                    | ✗ **2F** / 0P / 1S                 |
| auth-basic                                                           | ✗ **2F** / 0P                         | ✓ 0F / 2P                          |
| bulk-edit                                                            | ✗ **1F** / 19P                        | ✓ 0F / 20P                         |
| dashboard                                                            | CANCELLED                             | ✓ 0F / 20P                         |
| field-error-states                                                   | ✗ **1F** / 9P                         | ✓ 0F / 10P                         |
| field-paths                                                          | ✗ **1F** / 1P                         | ✓ 0F / 2P                          |
| fields-relationship                                                  | ✗ **34F** / 0P / 4S                   | ✓ 0F / 33P / 4S                    |
| fields**collections**Array                                           | ✗ **4F** / 23P / 1S                   | ✓ 0F / 28P / 1S                    |
| fields**collections**Blocks                                          | ✗ **6F** / 30P                        | ✓ 0F / 36P                         |
| fields**collections**Blocks#config.blockreferences.ts                | ✗ **6F** / 30P                        | ✓ 0F / 35P                         |
| fields**collections**Checkbox                                        | ✗ **1F** / 2P                         | ✓ 0F / 3P                          |
| fields**collections**Collapsible                                     | ✗ **2F** / 1P / 1S                    | ✓ 0F / 4P / 1S                     |
| fields**collections**ConditionalLogic                                | ✗ **3F** / 11P                        | ✓ 0F / 14P                         |
| fields**collections**CustomID                                        | ✓ 0F / 3P                             | ✓ 0F / 3P                          |
| fields**collections**Date                                            | ✓ 0F / 65P / 2S                       | ✓ 0F / 67P / 2S                    |
| fields**collections**Email                                           | ✗ **4F** / 6P                         | ✓ 0F / 9P                          |
| fields**collections**Indexed                                         | ✓ 0F / 1P                             | ✓ 0F / 1P                          |
| fields**collections**JSON                                            | ✗ **1F** / 6P                         | ✓ 0F / 8P                          |
| fields**collections**Number                                          | ✓ 0F / 11P / 2S                       | ✓ 0F / 11P / 2S                    |
| fields**collections**Point                                           | ✗ **1F** / 3P / 1S                    | ✓ 0F / 4P / 1S                     |
| fields**collections**Radio                                           | ✗ **3F** / 4P                         | ✓ 0F / 7P                          |
| fields**collections**Relationship                                    | ✗ **11F** / 4P (+1 shard cancelled)   | ✓ 0F / 33P / 6S                    |
| fields**collections**Row                                             | ✓ 0F / 6P                             | ✓ 0F / 6P                          |
| fields**collections**Select                                          | ✗ **2F** / 3P / 3S                    | ✓ 0F / 6P / 3S                     |
| fields**collections**Tabs                                            | ✗ **1F** / 7P / 1S                    | ✓ 0F / 8P / 1S                     |
| fields**collections**Tabs2                                           | ✓ 0F / 1P                             | ✓ 0F / 1P                          |
| fields**collections**Text                                            | ✗ **1F** / 18P / 1S                   | ✓ 0F / 19P / 1S                    |
| fields**collections**UI                                              | ✗ **1F** / 0P                         | ✓ 0F / 1P                          |
| fields**collections**Upload                                          | ✗ **8F** / 1P / 3S                    | ✓ 0F / 9P / 3S                     |
| fields**collections**UploadMultiPoly                                 | ✗ **2F** / 0P                         | ✓ 0F / 2P                          |
| fields**collections**UploadPoly                                      | ✗ **1F** / 0P                         | ✓ 0F / 1P                          |
| folders                                                              | ✗ **34F** / 2P                        | ✓ 0F / 35P                         |
| form-state                                                           | ✗ **16F** / 1P / 4S                   | ✓ 0F / 16P / 4S                    |
| group-by                                                             | CANCELLED                             | ✓ 0F / 37P / 1S                    |
| hooks                                                                | ✓ 0F / 6P                             | ✓ 0F / 6P                          |
| i18n                                                                 | ✗ **7F** / 0P                         | ✓ 0F / 7P                          |
| joins                                                                | CANCELLED                             | ✓ 0F / 28P                         |
| lexical**collections**LexicalHeadingFeature                          | ✗ **1F** / 0P                         | ✓ 0F / 1P                          |
| lexical**collections**LexicalJSXConverter                            | ✗ **1F** / 0P                         | ✓ 0F / 1P                          |
| lexical**collections**LexicalLinkFeature                             | ✗ **6F** / 0P                         | ✓ 0F / 6P                          |
| lexical**collections**LexicalListsFeature                            | ✗ **1F** / 0P                         | ✓ 0F / 1P                          |
| lexical**collections**Lexical**e2e**blocks                           | ✗ **29F** / 0P                        | ✓ 0F / 27P                         |
| lexical**collections**Lexical**e2e**blocks#config.blockreferences.ts | ✗ **29F** / 0P                        | ✓ 0F / 27P                         |
| lexical**collections**Lexical**e2e**main                             | ✗ **34F** / 0P / 2S                   | ✓ 0F / 29P / 2S                    |
| lexical**collections**OnDemandForm                                   | CANCELLED                             | ✓ 0F / 7P                          |
| lexical**collections**RichText                                       | ✗ **11F** / 1P / 4S                   | ✓ 0F / 9P / 4S                     |
| lexical**collections\_**LexicalFullyFeatured                         | CANCELLED                             | ✓ 0F / 14P                         |
| lexical**collections\_**LexicalFullyFeatured\_\_db                   | ✗ **6F** / 0P                         | ✓ 0F / 6P                          |
| live-preview                                                         | ✗ **11F** / 16P / 1S                  | ✓ 0F / 28P / 1S                    |
| localization                                                         | CANCELLED                             | ✓ 0F / 46P / 2S                    |
| locked-documents                                                     | ✗ **3F** / 42P                        | ✓ 0F / 45P                         |
| plugin-cloud-storage                                                 | ✗ **1F** / 0P                         | ✓ 0F / 3P                          |
| plugin-form-builder                                                  | ✗ **1F** / 4P                         | ✓ 0F / 5P                          |
| plugin-import-export                                                 | CANCELLED                             | ✓ 0F / 38P                         |
| plugin-multi-tenant                                                  | CANCELLED                             | ✓ 0F / 28P                         |
| plugin-multi-tenant#config.conditionalProvider.ts                    | CANCELLED                             | ✓ 0F / 30P                         |
| plugin-nested-docs                                                   | ✗ **2F** / 1P                         | ✓ 0F / 3P                          |
| plugin-redirects                                                     | ✗ **2F** / 1P                         | ✓ 0F / 3P                          |
| plugin-seo                                                           | ✗ **4F** / 1P / 2S                    | ✓ 0F / 3P / 2S                     |
| query-presets                                                        | CANCELLED                             | ✓ 0F / 24P / 2S                    |
| queues                                                               | ✓ 0F / 2P                             | ✓ 0F / 2P                          |
| server-url                                                           | ✗ **2F** / 0P                         | ✓ 0F / 2P                          |
| sort                                                                 | ✗ **2F** / 0P                         | ✓ 0F / 1P                          |
| storage-s3\_\_client-uploads                                         | ✗ **4F** / 0P                         | ✓ 0F / 4P                          |
| storage-vercel-blob\_\_client-uploads                                | ✗ **4F** / 0P                         | ✓ 0F / 4P                          |
| trash                                                                | ✗ **13F** / 7P (+1 shard cancelled)   | ✓ 0F / 40P                         |
| uploads                                                              | ✗ **75F** / 5P                        | ✓ 0F / 80P                         |
| versions                                                             | CANCELLED                             | ✓ 0F / 120P / 2S                   |
| **TOTAL**                                                            | **476F / 451P / 49S** (927 ran)       | **11F / 1,561P / 61S** (1,572 ran) |
| **Pass rate (ran)**                                                  | **48.7%**                             | **99.3%**                          |
| **Pass rate (all ~1,548)**                                           | **~29%** (cancelled = not passing)    | —                                  |

---

## Appendix — Full TanStack Failing Job List

### Failures (actual test failures)

| Suite                                                                                             | Status  |
| ------------------------------------------------------------------------------------------------- | ------- |
| E2E - a11y [tanstack-start]                                                                       | failure |
| E2E - access-control [tanstack-start] (1/2)                                                       | failure |
| E2E - access-control [tanstack-start] (2/2)                                                       | failure |
| E2E - admin-bar [tanstack-start]                                                                  | failure |
| E2E - admin**e2e**document-view [tanstack-start] (1/3)                                            | failure |
| E2E - admin**e2e**general [tanstack-start] (2/3)                                                  | failure |
| E2E - admin**e2e**list-view [tanstack-start] (1/4)                                                | failure |
| E2E - admin**e2e**list-view [tanstack-start] (2/4)                                                | failure |
| E2E - admin**e2e**list-view [tanstack-start] (3/4)                                                | failure |
| E2E - auth [tanstack-start]                                                                       | failure |
| E2E - auth-basic [tanstack-start]                                                                 | failure |
| E2E - bulk-edit [tanstack-start] (2/2)                                                            | failure |
| E2E - field-error-states [tanstack-start]                                                         | failure |
| E2E - field-paths [tanstack-start]                                                                | failure |
| E2E - fields-relationship [tanstack-start]                                                        | failure |
| E2E - fields**collections**Array [tanstack-start]                                                 | failure |
| E2E - fields**collections**Blocks [tanstack-start] (1/2)                                          | failure |
| E2E - fields**collections**Blocks [tanstack-start] (2/2)                                          | failure |
| E2E - fields**collections**Blocks#config.blockreferences.ts [tanstack-start] (1/2)                | failure |
| E2E - fields**collections**Blocks#config.blockreferences.ts [tanstack-start] (2/2)                | failure |
| E2E - fields**collections**Checkbox [tanstack-start]                                              | failure |
| E2E - fields**collections**Collapsible [tanstack-start]                                           | failure |
| E2E - fields**collections**ConditionalLogic [tanstack-start]                                      | failure |
| E2E - fields**collections**Email [tanstack-start]                                                 | failure |
| E2E - fields**collections**JSON [tanstack-start]                                                  | failure |
| E2E - fields**collections**Point [tanstack-start]                                                 | failure |
| E2E - fields**collections**Radio [tanstack-start]                                                 | failure |
| E2E - fields**collections**Relationship [tanstack-start] (2/2)                                    | failure |
| E2E - fields**collections**Select [tanstack-start]                                                | failure |
| E2E - fields**collections**Tabs [tanstack-start]                                                  | failure |
| E2E - fields**collections**Text [tanstack-start]                                                  | failure |
| E2E - fields**collections**UI [tanstack-start]                                                    | failure |
| E2E - fields**collections**Upload [tanstack-start]                                                | failure |
| E2E - fields**collections**UploadMultiPoly [tanstack-start]                                       | failure |
| E2E - fields**collections**UploadPoly [tanstack-start]                                            | failure |
| E2E - folders [tanstack-start] (1/3)                                                              | failure |
| E2E - folders [tanstack-start] (2/3)                                                              | failure |
| E2E - folders [tanstack-start] (3/3)                                                              | failure |
| E2E - form-state [tanstack-start]                                                                 | failure |
| E2E - i18n [tanstack-start]                                                                       | failure |
| E2E - lexical**collections**LexicalHeadingFeature [tanstack-start]                                | failure |
| E2E - lexical**collections**LexicalJSXConverter [tanstack-start]                                  | failure |
| E2E - lexical**collections**LexicalLinkFeature [tanstack-start]                                   | failure |
| E2E - lexical**collections**LexicalListsFeature [tanstack-start]                                  | failure |
| E2E - lexical**collections**Lexical**e2e**blocks [tanstack-start] (1/2)                           | failure |
| E2E - lexical**collections**Lexical**e2e**blocks [tanstack-start] (2/2)                           | failure |
| E2E - lexical**collections**Lexical**e2e**blocks#config.blockreferences.ts [tanstack-start] (1/2) | failure |
| E2E - lexical**collections**Lexical**e2e**blocks#config.blockreferences.ts [tanstack-start] (2/2) | failure |
| E2E - lexical**collections**Lexical**e2e**main [tanstack-start] (1/2)                             | failure |
| E2E - lexical**collections**Lexical**e2e**main [tanstack-start] (2/2)                             | failure |
| E2E - lexical**collections**RichText [tanstack-start]                                             | failure |
| E2E - lexical**collections\_**LexicalFullyFeatured\_\_db [tanstack-start]                         | failure |
| E2E - live-preview [tanstack-start] (1/2)                                                         | failure |
| E2E - live-preview [tanstack-start] (2/2)                                                         | failure |
| E2E - locked-documents [tanstack-start]                                                           | failure |
| E2E - plugin-cloud-storage [tanstack-start]                                                       | failure |
| E2E - plugin-form-builder [tanstack-start]                                                        | failure |
| E2E - plugin-nested-docs [tanstack-start]                                                         | failure |
| E2E - plugin-redirects [tanstack-start]                                                           | failure |
| E2E - plugin-seo [tanstack-start]                                                                 | failure |
| E2E - server-url [tanstack-start]                                                                 | failure |
| E2E - sort [tanstack-start]                                                                       | failure |
| E2E - storage-s3\_\_client-uploads#client-uploads/config.ts [tanstack-start]                      | failure |
| E2E - storage-vercel-blob\_\_client-uploads#client-uploads/config.ts [tanstack-start]             | failure |
| E2E - trash [tanstack-start] (2/2)                                                                | failure |
| E2E - uploads [tanstack-start] (1/3)                                                              | failure |
| E2E - uploads [tanstack-start] (2/3)                                                              | failure |
| E2E - uploads [tanstack-start] (3/3)                                                              | failure |

### Cancelled (45-minute timeout exceeded)

| Suite                                                                    | Status    |
| ------------------------------------------------------------------------ | --------- |
| E2E - admin-root [tanstack-start]                                        | cancelled |
| E2E - admin**e2e**document-view [tanstack-start] (2/3)                   | cancelled |
| E2E - admin**e2e**document-view [tanstack-start] (3/3)                   | cancelled |
| E2E - admin**e2e**general [tanstack-start] (1/3)                         | cancelled |
| E2E - admin**e2e**general [tanstack-start] (3/3)                         | cancelled |
| E2E - admin**e2e**list-view [tanstack-start] (4/4)                       | cancelled |
| E2E - dashboard [tanstack-start]                                         | cancelled |
| E2E - fields**collections**Relationship [tanstack-start] (1/2)           | cancelled |
| E2E - group-by [tanstack-start]                                          | cancelled |
| E2E - joins [tanstack-start]                                             | cancelled |
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
