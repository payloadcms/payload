---
name: e2e-write-visual-test
description: Use when writing a Playwright visual regression (screenshot comparison) test, tagging a test `@visual`, generating or updating baseline screenshots, running visual tests locally, or debugging a failing screenshot comparison in CI.
---

# Writing and Running Visual Regression Tests

## Overview

Visual regression tests are normal Playwright e2e tests tagged `@visual` that compare a screenshot against a committed baseline PNG instead of (or in addition to) asserting on the DOM. They live alongside normal e2e tests — there is no separate test type or directory to register a test in.

Key pieces:

- `test/__helpers/e2e/visual.ts` — the `visual()` helper. Declares a test tagged `@visual` without the tag needing to be typed (and possibly forgotten) at each call site. Prefer this over `test()` with a manual tag for any normal visual regression test.
- `test/__helpers/e2e/expectScreenshot.ts` — the helper that takes the screenshot and diffs it against the baseline.
- `test/playwright.config.ts` — `toHaveScreenshot.maxDiffPixelRatio` (anti-aliasing tolerance) and `snapshotPathTemplate` (where baselines are stored).
- `.github/scripts/visual/find-visual-suites.mjs` — discovers every suite that has an `@visual`-tagged test by scanning `test/**/e2e.spec.ts` for either the string `@visual` or a `visual()` helper import. Nothing needs to be registered anywhere else — add a `visual()` test and it's picked up automatically next time visual tests run.
- `.github/scripts/visual/run-visual-suites.sh` — loops `pnpm test:e2e:prod:server:run:noturbo <suite> --grep @visual` over either an explicit suite or every discovered suite. Shared by CI and the local Docker script.

## Writing a new visual test

Use the `visual()` helper instead of `test()` and call `expectScreenshot` instead of (or alongside) normal assertions:

```ts
import { expectScreenshot } from '../__helpers/e2e/expectScreenshot.js'
import { visual } from '../__helpers/e2e/visual.js'

visual('renders the posts list view', async () => {
  await page.goto(url.list)

  // Assert the page actually loaded before screenshotting — a screenshot of an error
  // page or a spinner will "pass" the pixel diff and hide a real bug.
  const textCell = page.locator('.row-1 .cell-title')
  await expect(textCell).toBeVisible()

  await expectScreenshot({ name: 'posts-list-view.png', page })
})
```

`visual()` applies the `@visual` tag for you, so there's nothing to remember. A test written with plain `test()` that forgets the tag is intentionally excluded from the visual-regression flow rather than caught after the fact — use `visual()` from the start instead of tagging manually.

- `name` — the baseline filename. Baselines are stored at `test/<suite>/__snapshots__/e2e.spec.ts/<name>`.
- `target` (optional) — a `Locator` to screenshot instead of the full page. Prefer this for testing one component in isolation; it's less prone to unrelated diffs elsewhere on the page.
- `mask` (optional) — an array of `Locator`s to blank out before comparing (timestamps, avatars, anything non-deterministic that isn't the thing under test).

Put it in whichever suite's existing `e2e.spec.ts` the feature belongs to — same convention as any other e2e test. Nothing else needs to be wired up.

### Manually tagging instead

`visual()` only covers the plain `test()` case. For a variant it doesn't wrap — `test.skip`, `test.only`, `test.fixme`, a `test.describe` block, or a deliberately different tag (e.g. `@visual-canary`, see `test/admin/e2e/visual/e2e.spec.ts`) — tag it directly instead:

```ts
test('renders the posts list view', { tag: '@visual' }, async () => {
  await page.goto(url.list)
  await expectScreenshot({ name: 'posts-list-view.png', page })
})
```

This is picked up by `find-visual-suites.mjs` the same way, since it also matches a literal `@visual` string in the file.

## Generating / updating the baseline

**Baselines must be generated inside the pinned Playwright Docker image — never on a bare host.** Font hinting/anti-aliasing differs enough between operating systems that a baseline captured on macOS or Windows will fail the comparison on CI even when nothing visually changed.

```bash
pnpm docker:start                              # MongoDB, if not already running
pnpm test:visual:update
```

This runs every suite with an `@visual` test inside `mcr.microsoft.com/playwright:vX-noble` (the same image CI uses) and writes/overwrites the baseline PNGs. Commit the resulting PNGs.

To scope it to one suite:

```bash
pnpm test:visual <suite> -- --update-snapshots
```

**Never produce the baseline PNG any other way** — not a manual screenshot, not a screenshot/browser tool, not an agent's own screenshot capability, not copying an image from somewhere else — even if it looks pixel-identical when you look at it. The comparison in CI runs against the exact renderer/font stack inside that Docker image; a PNG from anywhere else can look correct to a human and still fail every single CI run, deterministically, because the mismatch is systemic (font hinting), not random. If you did not run one of the two commands above to produce the file, don't commit it.

## Running visual tests locally (without updating baselines)

```bash
pnpm docker:start
pnpm test:visual                 # every suite with an @visual test
pnpm test:visual <suite>         # just one suite
```

Extra Playwright flags can be forwarded after `--`, e.g. `pnpm test:visual _community -- --headed`.

**`@visual` tests are not picked up by plain `pnpm test:e2e` / `pnpm test`.** This is intentional, not a gap to work around:

- `runE2E.ts` excludes `@visual` by default (`--grep-invert=@visual`) unless you explicitly pass `--grep @visual`.
- `expectScreenshot` refuses to run unless `PAYLOAD_TEST_PROD === 'true'` (set by `--prod-server`), because a dev-server render isn't representative of what CI compares against — dev mode injects extra overlays/markup and skips minification, which would make every baseline drift for reasons unrelated to a real visual change.

So the Docker script is the only supported way to run or update these tests, both locally and conceptually in CI.

## How CI runs these

- The `changes` job's `needs_visual` filter (in `.github/workflows/main.yml`) gates a dedicated `visual-regression` job so it only runs on PRs that could plausibly touch rendered UI (`.css`/`.scss`/`.tsx`/`.jsx`/`.svg` under `packages/**`/`test/**`, `__snapshots__/**`, the fixture config the current `@visual` tests render, the Playwright config, etc.).
- That job runs `run-visual-suites.sh` inside the same pinned Docker image and fails if any comparison failed.
- The everyday e2e matrix job explicitly excludes `@visual` (`--grep-invert="@visual"`) so screenshot comparisons never run there — they only ever run in `visual-regression`.
- There is no CI-posted comment or bot-driven snapshot update. If `visual-regression` fails, reproduce and inspect the diff locally with `pnpm test:visual`, then update baselines with `pnpm test:visual:update` and push them yourself.

## Common pitfalls

- **Screenshotting before the page settles** — always assert something meaningful is visible (`await expect(locator).toBeVisible()`) before calling `expectScreenshot`, otherwise a loading spinner or error state can get baselined.
- **Not masking non-deterministic content** — timestamps, relative dates, avatars, anything that legitimately differs between runs needs `mask`, not a wider `maxDiffPixelRatio`.
- **Masking a table cell doesn't stop its content from affecting layout** — a mask paints over a cell after layout, but an auto-layout table still sizes its columns from the cell's real (masked-out) text. A non-deterministic value in a masked cell (a live timestamp, a generated ID) can still shift that column's width by a pixel and reflow every other column in the row, failing the comparison intermittently even though nothing in the visible content changed. If a masked cell sits in a table, force `table-layout: fixed` (via `page.addStyleTag`) before the screenshot so column widths stop depending on cell content at all. The signature: an intermittent failure — sometimes clean, sometimes not — with a different pixel-diff count each time it fails, concentrated at column boundaries and in text right next to the masked cell (see `test/versions/e2e.spec.ts`'s versions-list visual test).
- **Generating a baseline on a bare host** — it will look fine locally and fail every time on CI. Always use `pnpm test:visual:update`.
- **Committing a manually captured screenshot as the baseline** — a screenshot from dev tools, an agent's screenshot tool, or anywhere else outside `pnpm test:visual`/`pnpm test:visual:update` is never a valid baseline, no matter how closely it matches by eye. It will fail the CI comparison deterministically, every run, with the same pixel diff each time — that's the signature to recognize it by if you're debugging a failure like this.
- **Expecting `pnpm test:e2e` to run `@visual` tests** — it won't; use the Docker script.
