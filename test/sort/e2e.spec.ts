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
import { sortableSlug } from './collections/Sortable/index.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test
let url: AdminUrlUtil

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

    url = new AdminUrlUtil(serverURL, sortableSlug)

    console.log('url', url, testInfo)

    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)

    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  // assertRows contains expect
  // eslint-disable-next-line playwright/expect-expect
  test('Sortable collection', async () => {
    await page.goto(url.list)
    await page.getByLabel('Sort by Order Ascending').click()
    await assertRows(['A', 'a0'], ['B', 'a1'], ['C', 'a2'], ['D', 'a3'])
    await moveRow(2, 3)
    await assertRows(['A', 'a0'], ['C', 'a2'], ['B', 'a2V'], ['D', 'a3'])
  })
})

async function moveRow(from: number, to: number) {
  // counting from 1, zero excluded
  const dragHandle = page.locator(`tbody .sort-row`)
  const source = dragHandle.nth(from - 1)
  const target = dragHandle.nth(to - 1)

  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) {
    throw new Error('Could not find elements to drag and drop')
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

  const pendingOrder = page.locator('td.cell-_order').getByText('pending')
  await expect.poll(() => pendingOrder.count()).toBe(1)
}

async function assertRows(...expectedRows: Array<[string, string]>) {
  const cellTitle = page.locator('td.cell-title a')
  const cellOrder = page.locator('td.cell-_order')

  const rows = page.locator('tbody .sort-row')
  await expect.poll(() => rows.count()).toBe(expectedRows.length)

  for (let i = 0; i < expectedRows.length; i++) {
    await expect(cellTitle.nth(i)).toHaveText(expectedRows[i]![0])
    await expect(cellOrder.nth(i)).toHaveText(expectedRows[i]![1])
  }
}
