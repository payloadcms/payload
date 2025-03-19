import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { RESTClient } from 'helpers/rest.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
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

  // NOTES: It works for me in headed browser but not in headless, I don't know why.
  //  If you are debugging this test, remember to press the seed button before each attempt.
  // assertRows contains expect
  // eslint-disable-next-line playwright/expect-expect
  test('Orderable collection', async () => {
    const url = new AdminUrlUtil(serverURL, orderableSlug)
    await page.goto(`${url.list}?sort=-_order`)
    // SORT BY ORDER ASCENDING
    await page.locator('.sort-header button').nth(0).click()
    await assertRows(0, 'A', 'B', 'C', 'D')
    await moveRow(2, 3) // move to middle
    await assertRows(0, 'A', 'C', 'B', 'D')
    await moveRow(3, 1) // move to top
    await assertRows(0, 'B', 'A', 'C', 'D')
    await moveRow(1, 4) // move to bottom
    await assertRows(0, 'A', 'C', 'D', 'B')

    // SORT BY ORDER DESCENDING
    await page.locator('.sort-header button').nth(0).click()
    await page.waitForURL(/sort=-_order/, { timeout: 2000 })
    await assertRows(0, 'B', 'D', 'C', 'A')
    await moveRow(1, 3) // move to middle
    await assertRows(0, 'D', 'C', 'B', 'A')
    await moveRow(3, 1) // move to top
    await assertRows(0, 'B', 'D', 'C', 'A')
    await moveRow(1, 4) // move to bottom
    await assertRows(0, 'D', 'C', 'A', 'B')

    // SORT BY TITLE
    await page.getByLabel('Sort by Title Ascending').click()
    await page.waitForURL(/sort=title/, { timeout: 2000 })
    await moveRow(1, 3, 'warning') // warning because not sorted by order first
  })

  test('Orderable join fields', async () => {
    const url = new AdminUrlUtil(serverURL, orderableJoinSlug)
    await page.goto(url.list)

    await page.getByText('Join A').click()
    await expect(page.locator('.sort-header button')).toHaveCount(2)

    await page.locator('.sort-header button').nth(0).click()
    await assertRows(0, 'A', 'B', 'C', 'D')
    await moveRow(2, 3, 'success', 0) // move to middle
    await assertRows(0, 'A', 'C', 'B', 'D')

    await page.locator('.sort-header button').nth(1).click()
    await assertRows(1, 'A', 'B', 'C', 'D')
    await moveRow(1, 4, 'success', 1) // move to end
    await assertRows(1, 'B', 'C', 'D', 'A')

    await page.reload()
    await page.locator('.sort-header button').nth(0).click()
    await page.locator('.sort-header button').nth(1).click()
    await assertRows(0, 'A', 'C', 'B', 'D')
    await assertRows(1, 'B', 'C', 'D', 'A')
  })
})

async function moveRow(
  from: number,
  to: number,
  expected: 'success' | 'warning' = 'success',
  nthTable = 0,
) {
  // counting from 1, zero excluded
  const table = page.locator(`tbody`).nth(nthTable)
  const dragHandle = table.locator(`.sort-row`)
  const source = dragHandle.nth(from - 1)
  const target = dragHandle.nth(to - 1)

  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) {
    throw new Error(
      `Could not find elements to DnD. Probably the dndkit animation is not finished. Try increasing the timeout`,
    )
  }
  // steps is important: move slightly to trigger the drag sensor of DnD-kit
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2, {
    steps: 10,
  })
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 10,
  })
  await page.mouse.up()
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(400) // dndkit animation

  if (expected === 'warning') {
    const toast = page.locator('.payload-toast-item.toast-warning')
    await expect(toast).toHaveText(
      'To reorder the rows you must first sort them by the "Order" column',
    )
  }
}

async function assertRows(nthTable: number, ...expectedRows: Array<string>) {
  const table = page.locator('tbody').nth(nthTable)
  const cellTitle = table.locator('.cell-title > :first-child')

  const rows = table.locator('.sort-row')
  await expect.poll(() => rows.count()).toBe(expectedRows.length)

  for (let i = 0; i < expectedRows.length; i++) {
    await expect(cellTitle.nth(i)).toHaveText(expectedRows[i]!)
  }
}
