import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { afterAll, beforeAll, beforeEach, describe } = test

let productsUrl: AdminUrlUtil
let page: Page
let payload: PayloadTestSDK<Config>
let serverURL: string
let zeroPriceProductId: string

describe('Ecommerce Plugin', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { payload: payloadFromInit, serverURL: serverURLFromInit } =
      await initPayloadE2ENoConfig<Config>({
        dirname,
      })
    payload = payloadFromInit
    serverURL = serverURLFromInit
    productsUrl = new AdminUrlUtil(serverURL, 'products')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })

    // Create a product with price set to 0 (base value)
    const zeroPriceProduct = await payload.create({
      collection: 'products',
      data: {
        priceInUSDEnabled: true,
        priceInUSD: 0,
      },
    })
    zeroPriceProductId = zeroPriceProduct.id
  })

  afterAll(async () => {
    if (zeroPriceProductId) {
      await payload.delete({
        collection: 'products',
        where: { id: { equals: zeroPriceProductId } },
      })
    }
  })

  beforeEach(async () => {
    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('PriceCell', () => {
    test('should display $0.00 for a zero price instead of priceNotSet', async () => {
      const columnsParam = encodeURIComponent(JSON.stringify(['priceInUSD']))

      await page.goto(`${productsUrl.list}?columns=${columnsParam}`)

      // The table should contain a cell showing $0.00 for our zero-price product
      const zeroPriceCell = page.locator('.cell-priceInUSD', { hasText: '$0.00' }).first()
      await expect(zeroPriceCell).toBeVisible()
    })
  })
})
