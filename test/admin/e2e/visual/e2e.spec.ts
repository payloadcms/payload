import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { expectScreenshot } from '../../../__helpers/e2e/expectScreenshot.js'
import { visual } from '../../../__helpers/e2e/visual.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../../../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { postsCollectionSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

test.describe('Visual', () => {
  let page: Page
  let url: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL } = await initPayloadE2ENoConfig({ dirname })
    url = new AdminUrlUtil(serverURL, postsCollectionSlug)

    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
  })

  visual('renders the posts list view', async () => {
    await page.goto(url.list)

    const textCell = page.locator('.row-1 .cell-title')
    await expect(textCell).toBeVisible()

    await expectScreenshot({ name: 'posts-list-view.png', mask: [page.locator('.cell-id')], page })
  })

  visual('renders the dashboard status badge', async () => {
    await page.goto(url.admin)

    const badge = page.locator('.dashboard-status__badge')
    await expect(badge).toBeVisible()

    await expectScreenshot({ name: 'dashboard-status-badge.png', page, target: badge })
  })

  // Same badge, but the committed baseline is a deliberately recolored copy of a real render (see
  // `test/scripts/generate-visual-canary-baseline.mjs`) rather than the current green "Operational"
  // badge — a stand-in for the everyday case of someone changing a component's styling without
  // regenerating its snapshot. `expectScreenshot` is expected to throw every time as a result. This
  // exercises the visual-regression diffing pipeline itself (actual/expected/diff image generation,
  // `pnpm test:visual:preview`) against a guaranteed mismatch —
  // a normal passing suite never produces diff artifacts to verify that machinery against, so
  // without this there is no way to notice if the pipeline silently stopped producing them.
  //
  // Wrapped in `.rejects.toThrow()` rather than left to fail outright: `toHaveScreenshot` still
  // writes the actual/expected/diff PNGs to test-results before throwing, so the pipeline gets
  // exercised exactly the same either way, but this way the test itself reports a normal pass —
  // no `@visual`-sweep exclusion or "expected failure" annotation needed to keep it from tripping
  // the `visual-regression` CI gate.
  test(
    'always shows a visual diff (canary for the diffing pipeline)',
    { tag: '@visual-canary' },
    async () => {
      await page.goto(url.admin)

      const badge = page.locator('.dashboard-status__badge')
      await expect(badge).toBeVisible()

      await expect(
        expectScreenshot({ name: 'dashboard-status-badge-canary.png', page, target: badge }),
      ).rejects.toThrow()
    },
  )
})
