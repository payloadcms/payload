import type { Locator, Page, TestInfo } from '@playwright/test'

import { expect, test } from '@playwright/test'

/**
 * Takes a deterministic screenshot and compares it against the committed baseline.
 * Waits for web fonts to finish loading and disables animations/transitions first,
 * since both are common sources of non-deterministic diffs between otherwise
 * identical runs.
 *
 * Baselines must be generated/updated inside the pinned Playwright Docker image
 * (`pnpm test:visual:update`), never on a bare host,
 * since font rendering differs enough between operating systems to fail the
 * comparison on CI even when nothing visually changed.
 *
 * Refuses to run outside a real production build (`PAYLOAD_TEST_PROD !== 'true'`, set by
 * `--prod-server`, see `test/runE2E.ts`). A dev-server render isn't representative of what CI
 * compares against — Next.js dev mode injects extra overlays/markup and skips minification — so
 * a baseline captured against it would drift from the committed one for reasons that have
 * nothing to do with an actual visual change.
 *
 * On a match, also attaches the actual/expected images to the test result (Playwright only does
 * this itself on a mismatch). The HTML report groups attachments into its Actual/Expected/Side by
 * side/Slider comparison view by filename alone, regardless of pass/fail, so this is what makes
 * `pnpm test:visual:preview` show a comparison for every `@visual` test, not just failing ones.
 *
 * @example
 * ```typescript
 * test('renders the block field collapsed', { tag: '@visual' }, async ({ page }) => {
 *   await page.goto(url.create)
 *   await expectScreenshot({ page, name: 'block-field-collapsed.png' })
 * })
 * ```
 */
export async function expectScreenshot({
  name,
  mask,
  page,
  target,
}: {
  mask?: Locator[]
  name: string
  page: Page
  /** Locator to screenshot instead of the full page. */
  target?: Locator
}): Promise<void> {
  if (process.env.PAYLOAD_TEST_PROD !== 'true') {
    throw new Error(
      `expectScreenshot('${name}') must run against a production build. Use ` +
        `'pnpm test:visual' locally, or '--prod-server' directly, instead of the ` +
        `plain dev-server e2e runner.`,
    )
  }

  await page.evaluate(() => document.fonts.ready)

  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
      scroll-behavior: auto !important;
    }`,
  })

  const screenshotTarget = target ?? page

  await expect(screenshotTarget).toHaveScreenshot(name, { mask })

  // Only reached on a match — toHaveScreenshot throws before this line on a mismatch, and by then
  // Playwright has already attached actual/expected/diff itself.
  await attachMatchedComparison({ name, mask, screenshotTarget, testInfo: test.info() })
}

async function attachMatchedComparison({
  name,
  mask,
  screenshotTarget,
  testInfo,
}: {
  mask?: Locator[]
  name: string
  screenshotTarget: Locator | Page
  testInfo: TestInfo
}): Promise<void> {
  const expectedPath = testInfo.snapshotPath(name, { kind: 'screenshot' })
  const baseName = name.replace(/\.png$/, '')
  const actualBuffer = await screenshotTarget.screenshot({ mask })

  await testInfo.attach(`${baseName}-actual`, { body: actualBuffer, contentType: 'image/png' })
  await testInfo.attach(`${baseName}-expected`, { contentType: 'image/png', path: expectedPath })
}
