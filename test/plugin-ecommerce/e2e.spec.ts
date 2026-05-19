import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Ecommerce Plugin', () => {
  let page: Page
  let productsUrl: AdminUrlUtil
  let variantsUrl: AdminUrlUtil
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  let productWithPriceId: string
  let zeroPriceProductId: string
  let noPriceProductId: string
  let seededVariantId: string

  const createdProductIDs: string[] = []

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { payload: payloadFromInit, serverURL: serverURLFromInit } =
      await initPayloadE2ENoConfig<Config>({
        dirname,
      })
    serverURL = serverURLFromInit
    payload = payloadFromInit
    productsUrl = new AdminUrlUtil(serverURL, 'products')
    variantsUrl = new AdminUrlUtil(serverURL, 'variants')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })

    // Create a product with USD and EUR prices
    const productWithPrice = await payload.create({
      collection: 'products',
      data: {
        priceInUSDEnabled: true,
        priceInUSD: 1999,
        priceInEUREnabled: true,
        priceInEUR: 2599,
      },
    })
    productWithPriceId = productWithPrice.id
    createdProductIDs.push(productWithPriceId)

    // Create a product with a zero price ($0.00)
    const zeroPriceProduct = await payload.create({
      collection: 'products',
      data: {
        priceInUSDEnabled: true,
        priceInUSD: 0,
      },
    })
    zeroPriceProductId = zeroPriceProduct.id
    createdProductIDs.push(zeroPriceProductId)

    // Create a product with no price set
    const noPriceProduct = await payload.create({
      collection: 'products',
      data: {},
    })
    noPriceProductId = noPriceProduct.id
    createdProductIDs.push(noPriceProductId)

    // Find a seeded variant (created by seed with priceInUSD: 1999)
    const seededVariants = await payload.find({
      collection: 'variants',
      where: { priceInUSD: { equals: 1999 } },
      limit: 1,
    })

    if (seededVariants.docs.length > 0) {
      seededVariantId = seededVariants.docs[0]!.id
    }
  })

  test.afterAll(async () => {
    for (const id of createdProductIDs) {
      await payload.delete({ collection: 'products', id }).catch(() => {})
    }
  })

  test.beforeEach(async () => {
    await ensureCompilationIsDone({ page, serverURL })
  })

  test.describe('PriceCell', () => {
    test('should display $0.00 for a zero price instead of priceNotSet', async () => {
      const columnsParam = encodeURIComponent(JSON.stringify(['priceInUSD']))

      await page.goto(`${productsUrl.list}?columns=${columnsParam}`)

      // The table should contain a cell showing $0.00 for our zero-price product
      const zeroPriceCell = page.locator('.cell-priceInUSD', { hasText: '$0.00' }).first()
      await expect(zeroPriceCell).toBeVisible()
    })
  })

  test.describe('PriceInput - Edit View', () => {
    test('should display the price input with correct decimal value', async () => {
      await page.goto(productsUrl.edit(productWithPriceId))
      await page.waitForURL(`**/products/${productWithPriceId}`)

      const priceInput = page.locator('input#priceInUSD.formattedPriceInput')
      await expect(priceInput).toBeVisible()
      await expect(priceInput).toHaveValue('19.99')
    })

    test('should display currency symbol in the price input', async () => {
      await page.goto(productsUrl.edit(productWithPriceId))
      await page.waitForURL(`**/products/${productWithPriceId}`)

      // Find the currency symbol within the formattedPrice container that contains the USD input
      const usdPriceContainer = page.locator('.formattedPrice:has(input#priceInUSD)')
      const currencySymbol = usdPriceContainer.locator('.formattedPriceCurrencySymbol')
      await expect(currencySymbol).toBeVisible()
      await expect(currencySymbol).toContainText('$')
    })

    test('should display EUR price with correct currency symbol and value', async () => {
      await page.goto(productsUrl.edit(productWithPriceId))
      await page.waitForURL(`**/products/${productWithPriceId}`)

      const eurPriceContainer = page.locator('.formattedPrice:has(input#priceInEUR)')
      const eurCurrencySymbol = eurPriceContainer.locator('.formattedPriceCurrencySymbol')
      await expect(eurCurrencySymbol).toBeVisible()
      await expect(eurCurrencySymbol).toContainText('€')

      const eurPriceInput = page.locator('input#priceInEUR.formattedPriceInput')
      await expect(eurPriceInput).toBeVisible()
      await expect(eurPriceInput).toHaveValue('25.99')
    })

    test('should display 0.00 for a zero price instead of hiding the field', async () => {
      await page.goto(productsUrl.edit(zeroPriceProductId))
      await page.waitForURL(`**/products/${zeroPriceProductId}`)

      const priceInput = page.locator('input#priceInUSD.formattedPriceInput')
      await expect(priceInput).toBeVisible()
      await expect(priceInput).toHaveValue('0.00')
    })

    test('should hide the price field when currency is not enabled', async () => {
      await page.goto(productsUrl.edit(noPriceProductId))
      await page.waitForURL(`**/products/${noPriceProductId}`)

      const priceInput = page.locator('input#priceInUSD.formattedPriceInput')
      await expect(priceInput).toBeHidden()
    })

    test('should allow editing the price and persist the correct base value', async () => {
      const editableProduct = await payload.create({
        collection: 'products',
        data: {
          priceInUSDEnabled: true,
          priceInUSD: 999,
        },
      })
      createdProductIDs.push(editableProduct.id)

      await page.goto(productsUrl.edit(editableProduct.id))
      await page.waitForURL(`**/products/${editableProduct.id}`)

      const priceInput = page.locator('input#priceInUSD.formattedPriceInput')
      await expect(priceInput).toBeVisible()
      await expect(priceInput).toHaveValue('9.99')

      // Clear and type a new price
      await priceInput.clear()
      await priceInput.fill('24.99')
      await priceInput.blur()

      await saveDocAndAssert(page)

      // Reload and verify the price persisted
      await page.reload()
      await page.waitForSelector('input#priceInUSD.formattedPriceInput')

      const updatedInput = page.locator('input#priceInUSD.formattedPriceInput')
      await expect(updatedInput).toHaveValue('24.99')

      const updatedProductResult = await payload.find({
        collection: 'products',
        where: { id: { equals: editableProduct.id } },
      })
      expect(updatedProductResult.docs[0]?.priceInUSD).toBe(2499)
    })
  })

  test.describe('Variant Product Prices', () => {
    test('should display variant price in the edit view', async () => {
      test.skip(!seededVariantId, 'No seeded variant found')

      await page.goto(variantsUrl.edit(seededVariantId))
      await page.waitForURL(`**/variants/${seededVariantId}`)

      const priceInput = page.locator('input#priceInUSD.formattedPriceInput')
      await expect(priceInput).toBeVisible()
      await expect(priceInput).toHaveValue('19.99')
    })
  })
})
