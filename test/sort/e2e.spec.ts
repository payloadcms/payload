import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { sortColumn } from 'helpers/e2e/columns/sortColumn.js'
import { moveRow } from 'helpers/e2e/sort/moveRow.js'
import { RESTClient } from 'helpers/rest.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch, throttleTest } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
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
    await throttleTest({ page, context, delay: 'Fast 4G' })
  })

  // NOTES: It works for me in headed browser but not in headless, I don't know why.
  //  If you are debugging this test, remember to press the seed button before each attempt.
  // assertRows contains expect
  // eslint-disable-next-line playwright/expect-expect
  test('Orderable collection', async () => {
    const url = new AdminUrlUtil(serverURL, orderableSlug)
    await page.goto(url.list)

    const joinFieldResolvePromise = page.waitForResponse(
      (response) => response.url().includes('/api/orderable-join') && response.status() === 200,
    )

    const seedResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/seed') && response.status() === 200,
    )

    await page.locator('.collection-list button', { hasText: 'Seed' }).click()
    await seedResponsePromise
    await joinFieldResolvePromise
    await page.goto(`${url.list}?sort=-_order`)

    await sortColumn(page, {
      fieldLabel: 'Order',
      fieldPath: '_order',
      targetState: 'asc',
    })

    await assertRows(0, 'A', 'B', 'C', 'D')

    await moveRow(page, {
      fromIndex: 2,
      toIndex: 3,
    })

    await assertRows(0, 'A', 'C', 'B', 'D')

    // move to top
    await moveRow(page, {
      fromIndex: 3,
      toIndex: 1,
    })

    await assertRows(0, 'B', 'A', 'C', 'D')

    // move to bottom
    await moveRow(page, {
      fromIndex: 1,
      toIndex: 4,
    })

    await assertRows(0, 'A', 'C', 'D', 'B')

    // Click the sort button again should not change the order
    // Note: In previous versions we allowed ascending and descending order.
    await page.locator('.sort-header button').nth(0).click()
    await page.waitForURL(/sort=_order/, { timeout: 2000 })
    await assertRows(0, 'A', 'C', 'D', 'B')

    await sortColumn(page, {
      fieldLabel: 'Title',
      fieldPath: 'title',
      targetState: 'asc',
    })

    // Expect a warning because not sorted by order first
    await moveRow(page, {
      fromIndex: 1,
      toIndex: 3,
      expected: 'warning',
    })
  })

  test('Orderable join fields', async () => {
    const url = new AdminUrlUtil(serverURL, orderableJoinSlug)
    await page.goto(url.list)

    await page.getByText('Join A').click()
    await expect(page.locator('.sort-header button')).toHaveCount(3)

    await assertRows(0, 'A', 'B', 'C', 'D')

    // move to middle
    await moveRow(page, {
      fromIndex: 2,
      toIndex: 3,
    })

    await assertRows(0, 'A', 'C', 'B', 'D')

    await assertRows(1, 'A', 'B', 'C', 'D')

    // move to end
    await moveRow(page, {
      fromIndex: 1,
      toIndex: 4,
      nthTable: 1,
    })

    await assertRows(1, 'B', 'C', 'D', 'A')

    await page.reload()
    await assertRows(0, 'A', 'C', 'B', 'D')
    await assertRows(1, 'B', 'C', 'D', 'A')
  })
})

async function assertRows(nthTable: number, ...expectedRows: Array<string>) {
  const table = page.locator('tbody').nth(nthTable)
  const cellTitle = table.locator('.cell-title > :first-child')

  const rows = table.locator('.sort-row')
  await expect.poll(() => rows.count()).toBe(expectedRows.length)

  for (let i = 0; i < expectedRows.length; i++) {
    await expect(cellTitle.nth(i)).toHaveText(expectedRows[i]!)
  }
}
