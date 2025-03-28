import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test

let payload: PayloadTestSDK<Config>

describe('Relationship Field with List Drawer', () => {
  let url: AdminUrlUtil
  let page: Page
  let serverURL: string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    url = new AdminUrlUtil(serverURL, 'relationship-using-list-drawer')

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })

    const movie1 = await payload.create({
      collection: 'movies',
      data: {
        name: 'Movie 1',
      },
    })

    const movie2 = await payload.create({
      collection: 'movies',
      data: {
        name: 'Movie 2',
      },
    })

    const movie3 = await payload.create({
      collection: 'movies',
      data: {
        name: 'Movie 3',
      },
    })

    const director1 = await payload.create({
      collection: 'directors',
      data: {
        name: 'Director 1',
        movies: [movie1.id, movie2.id, movie3.id],
      },
    })

    const director2 = await payload.create({
      collection: 'directors',
      data: {
        name: 'Director 2',
      },
    })

    await payload.create({
      collection: 'relationship-using-list-drawer',
      data: {
        relationship: movie1.id,
        hasManyRelationship: [movie1.id, movie2.id],
        polymorphicRelationship: {
          relationTo: 'movies',
          value: movie1.id,
        },
        polymorphicHasManyRelationship: [
          { relationTo: 'movies', value: movie1.id },
          { relationTo: 'directors', value: director1.id },
        ],
        polymorphicHasManyFiltered: [
          { relationTo: 'movies', value: movie2.id },
          { relationTo: 'directors', value: director2.id },
        ],
      },
    })
  })

  test('should open the list drawer when selecting a relationship', async () => {
    await page.goto(url.create)
    const relationshipField = page.locator('#field-relationship')
    await relationshipField.click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()

    const collectionList = listDrawerContent.locator('.collection-list--movies')
    await expect(collectionList).toBeVisible()
  })

  test('should add and save one item from the list drawer for hasOne relationship', async () => {
    await page.goto(url.create)
    const relationshipField = page.locator('#field-relationship')
    await relationshipField.click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()

    const firstRow = listDrawerContent.locator('table tbody tr').first()
    const button = firstRow.locator('button')
    await button.click()
    await expect(listDrawerContent).toBeHidden()

    const selectedValue = relationshipField.locator('.relationship--single-value__text')
    await expect(selectedValue).toBeVisible()

    await saveDocAndAssert(page)
  })

  test('should add multiple items from the list drawer for hasMany relationships', async () => {
    await page.goto(url.create)
    await page.locator('#field-hasManyRelationship').click()
    const listDrawerContentFirstClick = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContentFirstClick).toBeVisible()

    const firstRowFirstClick = listDrawerContentFirstClick.locator('table tbody tr').nth(0)
    const buttonFirstClick = firstRowFirstClick.locator('button')
    await buttonFirstClick.click()
    await expect(listDrawerContentFirstClick).toBeHidden()

    await page.locator('#field-hasManyRelationship').click()
    const listDrawerContentSecondClick = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContentFirstClick).toBeVisible()

    const firstRow = listDrawerContentSecondClick.locator('table tbody tr').nth(1)
    const button = firstRow.locator('button')
    await button.click()
    await expect(listDrawerContentSecondClick).toBeHidden()

    const selectedValues = page
      .locator('#field-hasManyRelationship')
      .locator('.relationship--multi-value-label__text')
    await expect(selectedValues).toHaveCount(2)

    await saveDocAndAssert(page)
  })

  test('should handle selecting already selected items for hasMany relationships', async () => {
    await page.goto(url.create)
    await page.locator('#field-hasManyRelationship').click()
    const listDrawerContentFirstClick = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContentFirstClick).toBeVisible()

    const firstRowFirstClick = listDrawerContentFirstClick.locator('table tbody tr').nth(0)
    const buttonFirstClick = firstRowFirstClick.locator('button')
    await buttonFirstClick.click()
    await expect(listDrawerContentFirstClick).toBeHidden()

    await page.locator('#field-hasManyRelationship').click()
    const listDrawerContentSecondClick = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContentFirstClick).toBeVisible()

    const firstRow = listDrawerContentSecondClick.locator('table tbody tr').nth(0)
    const button = firstRow.locator('button')
    await button.click()
    await expect(listDrawerContentSecondClick).toBeHidden()

    const selectedValues = page
      .locator('#field-hasManyRelationship')
      .locator('.relationship--multi-value-label__text')
    await expect(selectedValues).toHaveCount(1)

    await saveDocAndAssert(page)
  })

  test('should handle polymorphic relationships correctly', async () => {
    await page.goto(url.create)
    const relationshipField = page.locator('#field-polymorphicRelationship')
    await relationshipField.click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()

    const relationToSelector = page.locator('.list-header__select-collection')
    await expect(relationToSelector).toBeVisible()

    await relationToSelector.locator('.rs__control').click()
    const option = relationToSelector.locator('.rs__option').nth(1)
    await option.click()
    const directorsCollection = listDrawerContent.locator('.collection-list--directors')
    await expect(directorsCollection).toBeVisible()

    const firstRow = listDrawerContent.locator('table tbody tr').nth(0)
    const button = firstRow.locator('button')
    await button.click()
    await expect(listDrawerContent).toBeHidden()

    const selectedValues = relationshipField.locator('.relationship--single-value__text')
    await expect(selectedValues).toHaveCount(1)
    await saveDocAndAssert(page)
  })

  test('should respect filterOptions in the list drawer', async () => {
    await page.goto(url.create)
    const relationshipField = page.locator('#field-polymorphicHasManyFiltered')
    await relationshipField.click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()

    const rows = listDrawerContent.locator('table tbody tr')
    await expect(rows).toHaveCount(2)
  })
})
