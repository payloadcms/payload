import type { BrowserContext, Locator, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { goToListDoc } from '../__helpers/e2e/goToListDoc.js'
import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  // throttleTest
} from '../__helpers/e2e/helpers.js'
import { scrollEntirePage } from '../__helpers/e2e/scrollEntirePage.js'
import { moveRow } from '../__helpers/e2e/sort/moveRow.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { RESTClient } from '../__helpers/shared/rest.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { orderableSlug } from './collections/Orderable/index.js'
import { orderableJoinSlug } from './collections/OrderableJoin/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test
let page: Page
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let payload: PayloadTestSDK<Config>
let client: RESTClient
let serverURL: string
let context: BrowserContext

describe('Sort functionality', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)

    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  test.beforeEach(async () => {
    // await throttleTest({ page, context, delay: 'Fast 4G' })

    // The prod server may still be cold-starting in CI, so the first requests can
    // be refused (`fetch failed`). Poll the seed endpoint until it responds 200.
    await expect
      .poll(
        async () =>
          page.evaluate(async () => {
            try {
              const response = await fetch('/api/seed', { method: 'POST' })
              return response.status
            } catch {
              return 0
            }
          }),
        { timeout: TEST_TIMEOUT_LONG },
      )
      .toBe(200)
  })

  // eslint-disable-next-line playwright/expect-expect
  test('Orderable collection', async () => {
    const url = new AdminUrlUtil(serverURL, orderableSlug)
    await page.goto(url.list)

    const joinFieldResolvePromise = page.waitForResponse(
      (response) => response.url().includes('/api/orderable-join') && response.status() === 200,
    )

    await joinFieldResolvePromise
    await page.goto(`${url.list}?sort=-_order`)

    await page.locator('button.sort-header').nth(0).click()

    await assertRows(['A', 'B', 'C', 'D'])

    await moveRow(page, {
      fromIndex: 1,
      toIndex: 2,
    })

    await assertRows(['A', 'C', 'B', 'D'])

    // Move to top
    await moveRow(page, {
      fromIndex: 2,
      toIndex: 0,
    })

    await assertRows(['B', 'A', 'C', 'D'])

    // Move to bottom
    await moveRow(page, {
      fromIndex: 0,
      toIndex: 3,
    })

    await assertRows(['A', 'C', 'D', 'B'])

    // Note: Clicking the sort button again should not change the order
    // In previous versions we allowed ascending and descending order.
    await page.locator('button.sort-header').nth(0).click()
    await page.waitForURL(/sort=_order/, { timeout: 2000 })
    await assertRows(['A', 'C', 'D', 'B'])

    await page.getByLabel('Sort by Title Ascending').click()
    await page.waitForURL(/sort=title/, { timeout: 2000 })

    // Expect a warning because not sorted by order first
    await moveRow(page, {
      fromIndex: 0,
      toIndex: 2,
      expected: 'warning',
    })
  })

  test('Orderable join fields', async () => {
    const url = new AdminUrlUtil(serverURL, orderableJoinSlug)

    // Navigate via the row's href + hard `page.goto` instead of a soft Next.js
    // navigation. Under `--prod`, the edit route compiles lazily on first hit and
    // the soft navigation's URL only updates after the RSC payload arrives, which
    // can stall past the test timeout on a cold CI server.
    await goToListDoc({
      page,
      cellClass: '.cell-title',
      textToMatch: 'Join A',
      urlUtil: url,
    })

    await scrollEntirePage(page)

    await expect(page.locator('button.sort-header')).toHaveCount(3)

    await assertRows(['A', 'B', 'C', 'D'], {
      scope: page.locator('#field-orderableJoinField1'),
    })

    // Move to middle
    await moveRow(page, {
      fromIndex: 1,
      toIndex: 2,
      scope: page.locator('#field-orderableJoinField1'),
    })

    await assertRows(['A', 'C', 'B', 'D'], {
      scope: page.locator('#field-orderableJoinField1'),
    })

    await assertRows(['A', 'B', 'C', 'D'], {
      scope: page.locator('#field-orderableJoinField2'),
    })

    // Move to end
    await moveRow(page, {
      fromIndex: 0,
      toIndex: 3,
      scope: page.locator('#field-orderableJoinField2'),
    })

    await assertRows(['B', 'C', 'D', 'A'], {
      scope: page.locator('#field-orderableJoinField2'),
    })

    await page.reload()

    await assertRows(['A', 'C', 'B', 'D'], {
      scope: page.locator('#field-orderableJoinField1'),
    })

    await assertRows(['B', 'C', 'D', 'A'], {
      scope: page.locator('#field-orderableJoinField2'),
    })
  })
})

async function assertRows(
  expectedRows: Array<string>,
  options: {
    /**
     * Scope the assertion to a specific table in the DOM.
     * Useful when there are multiple sortable tables on the page.
     * If not provided, will search the first table on the page.
     */
    scope?: Locator
  } = {},
) {
  const { scope } = options
  const table = (scope || page).locator('tbody').first()
  await table.scrollIntoViewIfNeeded()
  // const cellTitle = table.locator('.cell-title > :first-child')

  const rows = table.locator('tr')
  await expect.poll(() => rows.count()).toBe(expectedRows.length)

  for (let i = 0; i < expectedRows.length; i++) {
    const cellTitle = table.locator('tr').nth(i).locator('.cell-title > :first-child')
    await expect(cellTitle).toHaveText(expectedRows[i]!)
  }
}
