# TanStack Start Adapter — E2E Test Results

> Last updated: 2026-04-10
> Source run: [GitHub Actions #24223922017](https://github.com/payloadcms/payload/actions/runs/24223922017)
> Branch: `experiment/framework-adapter-pattern`
> Head SHA: `5f0611c8e581f8fcb980b7b7aba2cbbe4b72afb0`

## Executive Summary

The previous "mostly green except for custom server components" summary is no
longer accurate for the latest TanStack run.

In this workflow, `next` completed with `95 success / 7 failed / 0 cancelled`
jobs, while `tanstack-start` completed with `4 success / 82 failed / 16
cancelled`. Of the `82` TanStack failures, `75` were not shared with the Next
matrix in the same run.

This means the current TanStack adapter is not E2E-ready yet. The dominant
problem is a widespread browser runtime failure, not isolated feature gaps.

## Run-Level Status

| Framework        | Total Jobs | Success | Failed | Cancelled | Success Rate |
| ---------------- | ---------- | ------- | ------ | --------- | ------------ |
| `next`           | 102        | 95      | 7      | 0         | **93.1%**    |
| `tanstack-start` | 102        | 4       | 82     | 16        | **3.9%**     |

## What Passed

Only four TanStack jobs completed successfully:

- `_community`
- `bulk-edit (1/2)`
- `hooks`
- `queues`

## Results by Suite Family

| Family              | Total | Success | Failed | Cancelled | Notes                                 |
| ------------------- | ----- | ------- | ------ | --------- | ------------------------------------- |
| Smoke and infra     | 3     | 3       | 0      | 0         | `_community`, `hooks`, `queues`       |
| Admin and platform  | 37    | 1       | 28     | 8         | Admin views, folders, uploads, trash  |
| Auth and app        | 8     | 0       | 6      | 2         | `auth`, `auth-basic`, `a11y`, `i18n`  |
| Fields              | 29    | 0       | 29     | 0         | Every field suite failed              |
| Lexical             | 14    | 0       | 12     | 2         | Rich text suites broadly failing      |
| Plugins and storage | 11    | 0       | 7      | 4         | Import-map and package resolution mix |

## Primary Failure Patterns

### 1. Widespread browser runtime crash

Most failing TanStack suites hit the same browser console error:

```text
SyntaxError: The requested module '.../scheduler/index.js?...'
does not provide an export named 'unstable_NormalPriority'
```

This showed up in representative failures across:

- `auth`
- `access-control`
- `admin__e2e__general`
- `fields__collections__Number`
- `lexical__collections__RichText`
- `uploads`

Once that runtime error fires, the rest of the test usually collapses into
missing DOM assertions because the admin UI never finishes rendering.

Typical follow-on failures include:

- missing `meta[name="description"]`
- missing `#toggle-list-filters`
- missing upload thumbnails like `tr.row-1 .thumbnail img`
- closed-page polling failures in Lexical tests

### 2. Import-map and client module resolution failures

At least one plugin suite fails before meaningful UI assertions because the
TanStack import map points at client modules that are not resolvable:

```text
Cannot find module '@payloadcms/plugin-form-builder/client'
imported from '/home/runner/work/payload/payload/tanstack-app/src/importMap.js'
```

This strongly suggests TanStack-specific client export or import-map generation
issues for plugin packages.

### 3. Separate feature-level rendering gaps

Not every failure is explained by the `scheduler` crash. For example,
`admin-bar` repeatedly fails because `#payload-admin-bar` never appears:

```text
expect(locator('#payload-admin-bar')).toBeVisible()
Error: element(s) not found
```

That points to at least some independent route or feature-rendering gaps even
outside the main runtime crash.

## Representative Failures

| Suite                            | Representative failure                                                                             | Interpretation                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `auth`                           | `scheduler` export mismatch in browser console                                                     | Core admin/runtime load failure                          |
| `access-control`                 | Same `scheduler` export mismatch                                                                   | Same root issue as auth                                  |
| `admin__e2e__general`            | `scheduler` crash, then missing `meta[name="description"]`                                         | Metadata/admin page never fully renders                  |
| `fields__collections__Number`    | `scheduler` crash, then filter toggle interactions end early                                       | Field list/admin UI not stable enough for interactions   |
| `lexical__collections__RichText` | `scheduler` crash, then `page.locator(...).count()` fails on closed page/context                   | Rich text suites are blocked by upstream runtime failure |
| `uploads (2/3)`                  | `scheduler` crash, then missing thumbnail locators                                                 | Upload UI never reaches expected rendered state          |
| `plugin-form-builder`            | `Cannot find module '@payloadcms/plugin-form-builder/client'` from `tanstack-app/src/importMap.js` | Import-map/client export problem                         |
| `admin-bar`                      | `#payload-admin-bar` never becomes visible                                                         | Separate adapter feature gap                             |

## Scope of TanStack-Only Breakage

Only `7` failing job names overlapped with the `next` matrix in the same run:

- `access-control (1/2)`
- `admin__e2e__general (1/3)`
- `admin__e2e__general (2/3)`
- `admin__e2e__document-view (1/3)`
- `admin__e2e__list-view (4/4)`
- `auth`
- `plugin-seo`

Everything else in the TanStack failure set was TanStack-only for this run.

## Current Assessment

The current blocker is not primarily custom server component support. The run is
failing much earlier and much more broadly:

1. A cross-suite browser runtime/import problem is breaking core admin renders.
2. Plugin client modules are not consistently resolvable from the TanStack
   import map.
3. Some adapter-specific UI features still do not render even when pages load.

Until those issues are fixed, field-level or component-level pass-rate analysis
is not very meaningful because many suites never reach their intended assertion
state.

## Recommended Priority Order

1. ~~Fix the `scheduler` runtime/export mismatch first, because it appears across
   admin, auth, fields, lexical, and uploads.~~
   **Fixed:** Root cause was `tanstack-app` depending on `scheduler@^0.25.0`
   while `react-dom@19.2.4` requires `scheduler@^0.27.0`. The version mismatch
   combined with the CJS-only `scheduler` package caused Vite's ESM interop to
   fail in the browser. Fix: bumped to `^0.27.0`, added `scheduler` to
   `optimizeDeps.include` and `resolve.dedupe` in the Vite plugin.
2. Fix TanStack import-map resolution for plugin client entrypoints.
3. Re-run the full matrix and only then reassess remaining genuine adapter
   limitations such as unsupported server components or route-specific gaps.
