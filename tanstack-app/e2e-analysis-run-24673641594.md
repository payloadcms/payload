# E2E Analysis — Run 24673641594

**PR**: payloadcms/payload#16139 — admin framework adapter pattern and tanstack support  
**Branch**: experiment/framework-adapter-pattern  
**Run date**: 2026-04-20  
**URL**: https://github.com/payloadcms/payload/actions/runs/24673641594

---

## Executive Summary

### Suite-level (jobs)

| Framework          | Passing jobs | Total jobs | Pass rate |
| ------------------ | ------------ | ---------- | --------- |
| **TanStack Start** | 34           | 106        | **32.1%** |
| **Next.js**        | 100          | 106        | **94.3%** |

### Full-pass unique suites

| Framework          | Full-pass suites | Total suites | Full-pass rate |
| ------------------ | ---------------- | ------------ | -------------- |
| **TanStack Start** | 28               | 80           | **35.0%**      |
| **Next.js**        | 75               | 80           | **93.8%**      |

### Important test-level signals from changed suites

| Suite                                  | Current signal                                | What it means                                                           |
| -------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `auth [tanstack-start]`                | **11 passed / 1 failed / 1 skipped**          | Biggest hidden improvement in this run: auth no longer dies immediately |
| `plugin-form-builder [tanstack-start]` | **10 passed / 8 failed**                      | New regression, not a total outage                                      |
| `admin__e2e__general [tanstack-start]` | **16 passed / 12 failed / 1 skipped** (shard) | Still heavily broken, but not all-red internally                        |
| `live-preview [tanstack-start] (2/2)`  | **12 passed / 1 failed / 1 skipped**          | One shard is now green; one remaining custom-preview failure            |
| `fields__collections__Indexed`         | **1 failed**                                  | Still a single-test regression                                          |

### Progress vs previous analyzed run (24477822883 — Apr 15)

| Metric                           | Run Apr 15 | Run Apr 20 | Delta  |
| -------------------------------- | ---------- | ---------- | ------ |
| TanStack passing jobs            | 33 / 106   | 34 / 106   | **+1** |
| TanStack cancelled jobs          | 22         | 20         | **-2** |
| TanStack full-pass unique suites | 28         | 28         | 0      |
| TanStack partial suites          | 2          | 3          | **+1** |
| Next.js passing jobs             | 100 / 106  | 100 / 106  | 0      |

**Net effect**: this run is not a big pass-rate jump, but it is materially more diagnosable. `auth` is no longer a near-empty failure, `live-preview` is partially green, `LexicalViewsProviderDefault` now passes, and several previous timeouts now produce real failing traces.

**Biggest regression**: `plugin-form-builder [tanstack-start]` was green in the previous run and now fails due to TanStack trying to execute a packaged `.scss` import from `@payloadcms/ui`.

**Notable shift from the previous report**: I did **not** see the old `Denied by specifier pattern` Node built-in signature in the sampled current failures. The dominant current blockers look more like rendering, routing, import map, and client-side UI integration bugs than browser-bundle builtin leakage.

---

## TanStack Start — Full-pass Suites (34/106 jobs, 28 unique suites)

Fully green suites:

- `_community`
- `auth-basic`
- `fields__collections__Array`
- `fields__collections__Blocks`
- `fields__collections__Blocks#config.blockreferences.ts`
- `fields__collections__Checkbox`
- `fields__collections__Collapsible`
- `fields__collections__ConditionalLogic`
- `fields__collections__CustomID`
- `fields__collections__Date`
- `fields__collections__Email`
- `fields__collections__JSON`
- `fields__collections__Number`
- `fields__collections__Point`
- `fields__collections__Radio`
- `fields__collections__Row`
- `fields__collections__Select`
- `fields__collections__Tabs`
- `fields__collections__Tabs2`
- `fields__collections__Text`
- `fields__collections__UI`
- `fields__collections__Upload`
- `fields__collections__UploadMultiPoly`
- `fields__collections__UploadPoly`
- `hooks`
- `lexical__collections__LexicalViewsProviderDefault` **NEW PASS**
- `plugin-nested-docs`
- `queues`

Partially green suites:

| Suite                   | Current state      | Previous state | Notes                              |
| ----------------------- | ------------------ | -------------- | ---------------------------------- |
| `admin__e2e__list-view` | shard `1/4` passes | same           | Still blocked on later shards      |
| `bulk-edit`             | shard `1/2` passes | same           | No net change                      |
| `live-preview`          | shard `1/2` passes | **improved**   | Was all-red before; now half-green |

**Composition change vs Apr 15**: the total number of fully green TanStack suites stayed flat at 28, but one new suite entered the green set (`LexicalViewsProviderDefault`) and one previously-green suite left it (`plugin-form-builder`).

---

## Key Changes Since Apr 15

### Improvements

| Change                                                                                                     | Evidence                                               | Assessment                                                                  |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `auth [tanstack-start]` is no longer a near-empty failure                                                  | job log now shows **11 passed / 1 failed / 1 skipped** | Biggest real improvement in this run, even though the job is still red      |
| `live-preview [tanstack-start] (1/2)` now passes                                                           | `failure -> success`                                   | Suggests the old live-preview middleware issue is at least partly addressed |
| `lexical__collections__LexicalViewsProviderDefault [tanstack-start]` now passes                            | `failure -> success`                                   | First green Lexical Views suite on TanStack                                 |
| `query-presets`, `versions (2/3)`, `versions (3/3)`, `LexicalViewsFrontend` now fail instead of cancelling | `cancelled -> failure`                                 | Better debugging signal, even if not a user-facing improvement              |

### Regressions

| Change                                           | Evidence               | Assessment                                       |
| ------------------------------------------------ | ---------------------- | ------------------------------------------------ |
| `plugin-form-builder [tanstack-start]` regressed | `success -> failure`   | Real TanStack regression introduced in this push |
| `a11y [tanstack-start]` now cancels              | `failure -> cancelled` | Worse signal; likely runtime/timeout regression  |
| `i18n [tanstack-start]` now cancels              | `failure -> cancelled` | Same pattern: less signal than before            |
| `plugin-cloud-storage [next]` regressed          | `success -> failure`   | Looks like CI infra, not product behavior        |

### Next.js Status

Next.js stays at **100/106** passing jobs overall, but the composition changed:

- `admin__e2e__list-view [next] (1/4)` recovered (`failure -> success`)
- `plugin-cloud-storage [next]` regressed (`success -> failure`)

So there is **no net pass-rate change**, but there is **one new non-product infra failure** in the Next matrix.

---

## TanStack Start — Root Cause Analysis

### Root Cause 1 — Auth now fails on a real UI loop, not a startup crash

**Affects**: `auth [tanstack-start]`  
**Current signal**: `11 passed / 1 failed / 1 skipped`

The remaining auth failure is now concrete and reproducible:

```text
Error: Maximum update depth exceeded
...
at packages/ui/src/elements/CloseModalOnRouteChange/index.tsx:27:5
at packages/ui/src/elements/CloseModalOnRouteChange/index.tsx:35:5
```

That React update loop prevents `#field-roles` from rendering in the failing test.

There are also import-map warnings in the same log:

```text
getFromImportMap: PayloadComponent not found in importMap
key: '/AuthDebug.js#AuthDebug'
```

**Assessment**: this suite is much closer to green than it looked in the Apr 15 run. The main auth blocker has narrowed from "TanStack auth is broken" to a specific route-change/modal lifecycle loop plus import-map wiring warnings around debug UI.

---

### Root Cause 2 — `plugin-form-builder` regressed on packaged SCSS loading

**Affects**: `plugin-form-builder [tanstack-start]`  
**Status**: **NEW REGRESSION**

The dominant error is:

```text
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".scss"
.../@payloadcms/ui/dist/icons/Chevron/index.scss
```

This suite still gets **10 tests passing**, but **8 fail** because TanStack is trying to execute a packaged SCSS import from `@payloadcms/ui/dist`.

**Assessment**: this is a real adapter/runtime regression, not a flaky test. It likely affects any flow that loads packaged UI icons/components from built output rather than source.

---

### Root Cause 3 — `fields__collections__Indexed` is still a real regression

**Affects**: `fields__collections__Indexed [tanstack-start]`  
**Status**: still failing

The single failing test remains:

```text
expect(locator('.field-type.text.error #field-uniqueText')).toBeVisible() failed
```

**Assessment**: this is still a narrow, likely fixable validation/error-state rendering regression. It no longer looks like a noisy systemic issue; it looks like a specific indexed-field error UI mismatch.

---

### Root Cause 4 — Live Preview is partially fixed, but custom preview rendering still breaks

**Affects**: `live-preview [tanstack-start]`  
**Status**: **improved**, but not fixed

This run is materially better:

- shard `1/2` now passes
- shard `2/2` fails with **12 passed / 1 failed / 1 skipped**

The remaining failure is no longer the old response-body-lock error. The sampled failing shard now shows:

```text
Locator: locator('.custom-live-preview')
Expected substring: "Custom live preview being rendered"
Error: element(s) not found
```

**Assessment**: the earlier middleware/Response-body bug may no longer be the main blocker. The current issue looks like a custom live-preview component not mounting/rendering in TanStack.

---

### Root Cause 5 — Lexical still fails because interactive editor UI is missing

**Affects**: most remaining `lexical__collections__* [tanstack-start]` suites  
**Status**: mostly unchanged, with one new green suite

Representative current error from `LexicalJSXConverter`:

```text
Locator: locator('#slash-menu .slash-menu-popup')
Expected: visible
Error: element(s) not found
```

That means the editor shell is present enough to start interacting, but the slash-command popover never appears.

**Assessment**: Lexical is still blocked by missing interactive editor UI in TanStack. `LexicalViewsProviderDefault` going green suggests some provider wiring improved, but the broader editing surface is still not rendering correctly.

---

### Root Cause 6 — Admin route transitions and click flows remain unstable

**Affects**: `admin__e2e__general`, `admin__e2e__document-view`, `admin__e2e__list-view`, `form-state`  
**Status**: still the biggest multi-suite blocker

Representative current signal from `admin__e2e__general [tanstack-start] (2/3)`:

- **16 passed / 12 failed / 1 skipped**
- repeated `locator.click: Test ended`
- repeated `page.waitForURL: Timeout 30000ms exceeded`

**Assessment**: admin flows are not universally broken, but route transitions and async navigation are still unstable enough to kill a large part of the matrix. This remains the biggest "many suites at once" TanStack blocker.

---

### Root Cause 7 — Some top-level admin surfaces are duplicated or missing

**Affects**: `server-url`, `admin-bar`, likely parts of admin shell rendering  
**Status**: still broken

Representative signals:

- `server-url [tanstack-start]`: strict-mode locator violation because `.dashboard` resolves to **2 elements**
- `admin-bar [tanstack-start]`: repeated `element(s) not found`

**Assessment**: TanStack still has admin-shell rendering issues at the page chrome level, not just in deep document/edit flows.

---

### Root Cause 8 — `plugin-cloud-storage [next]` is a CI infrastructure failure

**Affects**: `plugin-cloud-storage [next]`  
**Status**: **NEW NEXT.JS REGRESSION**, but not app-level

The failing job never reaches real test execution. CI cannot pull Azurite:

```text
pull access denied for mcr.microsoft.com/azure-storage/azurite
The request is blocked.
```

**Assessment**: this is an infra/network issue in CI, not a regression in the Next adapter or the PR code itself.

---

### Root Cause 9 — `build-template-plugin-` is still failing for the same TypeScript reason

**Affects**: non-E2E CI  
**Status**: unchanged

Same error as the previous analyzed run:

```text
src/components/BeforeDashboardServer.tsx(3,20): error TS2307:
Cannot find module './BeforeDashboardServer.module.css'
```

---

## Areas That Still Have No Green TanStack Jobs

Grouped by theme rather than listing all 72 non-green jobs individually:

- **Admin shell and navigation**: `access-control`, `admin-bar`, `admin-root`, `admin__e2e__document-view`, `admin__e2e__general`, `dashboard`, `form-state`, `server-url`
- **Lexical/editor UX**: `LexicalHeadingFeature`, `LexicalJSXConverter`, `LexicalLinkFeature`, `LexicalListsFeature`, `LexicalViewsFrontend`, `LexicalViewsNested`, `LexicalViewsProvider`, `Lexical__e2e__blocks`, `Lexical__e2e__main`, `RichText`, `LexicalFullyFeatured__db`, `OnDemandForm`, `LexicalFullyFeatured`
- **Collections / data flows**: `fields__collections__Indexed`, `fields__collections__Relationship`, `fields-relationship`, `folders`, `query-presets`, `versions`, `uploads`, `trash`
- **Plugins / storage**: `plugin-cloud-storage`, `plugin-form-builder`, `plugin-import-export`, `plugin-multi-tenant`, `plugin-redirects`, `plugin-seo`, `storage-s3__client-uploads`, `storage-vercel-blob__client-uploads`
- **Timeout-heavy suites**: `a11y`, `i18n`, `group-by`, `joins`, `localization`

---

## Next.js Regressions

**Total**: 6 failing jobs out of 106

### Likely existing flakes / known noisy jobs

| Suite                                    | Current status | Assessment                                  |
| ---------------------------------------- | -------------- | ------------------------------------------- |
| `access-control [next] (1/2)`            | failing        | Same family of partial Next flake as before |
| `admin__e2e__document-view [next] (1/3)` | failing        | Same partial Next flake pattern             |
| `admin__e2e__general [next] (1/3)`       | failing        | Same flaky shard family                     |
| `admin__e2e__general [next] (2/3)`       | failing        | Same flaky shard family                     |
| `admin__e2e__list-view [next] (4/4)`     | failing        | Same flaky shard family                     |

### New non-product failure

| Suite                         | Error                                                     | Assessment                                    |
| ----------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| `plugin-cloud-storage [next]` | blocked pulling `mcr.microsoft.com/azure-storage/azurite` | **CI infra issue**, not an adapter regression |

**Net new Next.js product regressions**: **0**  
**Net new Next.js CI/infrastructure regressions**: **1** (`plugin-cloud-storage`)

---

## Other Failures (Non-E2E)

### `build-template-plugin-` — unchanged TypeScript build failure

Still failing with:

```text
src/components/BeforeDashboardServer.tsx(3,20): error TS2307:
Cannot find module './BeforeDashboardServer.module.css'
```

### `All Green` — meta-job failure

This is downstream of the failing matrix jobs above, not an independent regression.

---

## Task List — Priority Order

### P0 — Critical / Highest leverage

1. **Fix `plugin-form-builder` SCSS loading in TanStack**

   - New regression in this run
   - Concrete error: `Unknown file extension ".scss"` from packaged `@payloadcms/ui`
   - Restores a suite that was green in the previous run

2. **Fix the `CloseModalOnRouteChange` update loop in TanStack auth**

   - `auth` is now close to green at the test level (`11P / 1F / 1S`)
   - Current blocker is specific and reproducible

3. **Fix `fields__collections__Indexed`**

   - Single failing test
   - Still the narrowest obvious TanStack regression to clean up

4. **Fix `build-template-plugin-`**
   - Still blocks the overall workflow from going green
   - Same one-line CSS module issue as before

### P1 — High priority

5. **Continue stabilizing admin route transitions/rendering**

   - Biggest remaining multi-suite blocker
   - Affects `document-view`, `general`, `list-view`, `form-state`

6. **Fix Lexical interactive UI rendering in TanStack**

   - Slash menu / popovers still missing
   - One Lexical Views suite is now green, so this area is moving

7. **Finish live-preview custom component rendering**

   - Old response-body error was not the sampled failure anymore
   - Remaining blocker is a missing `.custom-live-preview`

8. **Inspect `query-presets` and `versions` now that they produce real failures**

   - These jobs are more actionable than when they were just timing out

9. **Fix duplicate/missing admin shell surfaces**
   - `server-url` now shows duplicate `.dashboard`
   - `admin-bar` still cannot find required elements

### P2 — Investigation / cleanup

10. **Understand why `a11y` and `i18n` regressed from failure to cancelled**

    - Less signal than Apr 15
    - Likely timeout/perf-related rather than new logic regressions

11. **Stabilize `plugin-cloud-storage [next]` CI environment**
    - Unblock Azurite image pulls or mirror that dependency

---

## What Would Move the Needle Most

The next biggest wins are not the same as Apr 15.

**1. Auth update-loop fix** would likely flip a nearly-green suite immediately. This is the clearest "one bug, one suite" payoff in the current run.

**2. Plugin-form-builder SCSS loader fix** would both recover a regression and validate TanStack's ability to consume packaged UI output safely.

**3. Admin route/render stabilization** is still the biggest broad unlock. It would improve `document-view`, `general`, `list-view`, and `form-state` together.

**4. Lexical popover/render fixes** remain the main path to unlocking the large lexical block. `LexicalViewsProviderDefault` turning green is a good sign that this is now more incremental than before.

**5. Query-presets / versions diagnostics** are newly useful. These suites were mostly opaque timeouts before; now they should be debuggable from actual traces.

---

## Bottom Line

This run is **slightly better** than Apr 15 on TanStack by raw job count, but the more important change is **failure quality**:

- auth is now mostly executing
- live-preview is partially green
- one Lexical Views suite is green
- several old timeouts now emit actionable failures

At the same time, this push introduced a **real new TanStack regression** in `plugin-form-builder`, and Next picked up a **CI-only infra regression** in `plugin-cloud-storage`.

So the branch is still far from merge-ready on TanStack, but the remaining blockers are now more concrete and narrower than they were in the previous analyzed run.
