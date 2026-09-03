import type { PlaywrightTestArgs, PlaywrightWorkerArgs, TestInfo } from '@playwright/test'

import { test } from '@playwright/test'

/**
 * Declares a visual regression test, tagging it `@visual` so it's picked up by
 * `find-visual-suites.mjs` and the `visual-regression` CI job without the tag needing to be typed
 * (and possibly forgotten) at each call site. A test written with plain `test()` that forgets the
 * tag is intentionally excluded from the visual-regression flow rather than caught after the fact
 * — use `visual()` from the start instead.
 *
 * @example
 * ```typescript
 * visual('renders the posts list view', async ({ page }) => {
 *   await page.goto(url.list)
 *   await expectScreenshot({ page, name: 'posts-list-view.png' })
 * })
 * ```
 */
export function visual(
  title: string,
  body: (
    args: PlaywrightTestArgs & PlaywrightWorkerArgs,
    testInfo: TestInfo,
  ) => Promise<void> | void,
): void {
  test(title, { tag: '@visual' }, body)
}
