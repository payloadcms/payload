import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { reorderColumns } from 'helpers/e2e/reorderColumns.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, exactText, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { navigateToDoc } from '../helpers/e2e/navigateToDoc.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { categoriesSlug, postsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Admin Panel', () => {
  let page: Page
  let categoriesURL: AdminUrlUtil
  let postsURL: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload, serverURL } = await initPayloadE2ENoConfig({ dirname })
    postsURL = new AdminUrlUtil(serverURL, postsSlug)
    categoriesURL = new AdminUrlUtil(serverURL, categoriesSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('populates joined relationships in table cells of list view', async () => {
    await page.goto(categoriesURL.list)
    await expect
      .poll(
        async () =>
          await page
            .locator('tbody tr:first-child td.cell-relatedPosts', {
              hasText: exactText('Test Post 3, Test Post 2, Test Post 1'),
            })
            .isVisible(),
      )
      .toBeTruthy()
  })

  test('should render initial rows within relationship table', async () => {
    await navigateToDoc(page, categoriesURL)
    const joinField = page.locator('.field-type.join').first()
    await expect(joinField).toBeVisible()
    const columns = await joinField.locator('.relationship-table tbody tr').count()
    expect(columns).toBe(3)
  })

  test('should render collection type in first column of relationship table', async () => {
    await navigateToDoc(page, categoriesURL)
    const joinField = page.locator('.field-type.join').first()
    await expect(joinField).toBeVisible()
    const collectionTypeColumn = joinField.locator('thead tr th#heading-collection:first-child')
    const text = collectionTypeColumn
    await expect(text).toHaveText('Type')
    const cells = joinField.locator('.relationship-table tbody tr td:first-child .pill__label')

    const count = await cells.count()

    for (let i = 0; i < count; i++) {
      const element = cells.nth(i)
      // Perform actions on each element
      await expect(element).toBeVisible()
      await expect(element).toHaveText('Post')
    }
  })

  test('should render drawer toggler without document link in second column of relationship table', async () => {
    await navigateToDoc(page, categoriesURL)
    const joinField = page.locator('.field-type.join').first()
    await expect(joinField).toBeVisible()
    const actionColumn = joinField.locator('tbody tr td:nth-child(2)').first()
    const toggler = actionColumn.locator('button.doc-drawer__toggler')
    await expect(toggler).toBeVisible()
    const link = actionColumn.locator('a')
    await expect(link).toBeHidden()
    // change column order and ensure this behavior remains on the second column
    await reorderColumns(page, {
      togglerSelector: '.relationship-table__toggle-columns',
      columnContainerSelector: '.relationship-table__columns',
      fromColumn: 'Title',
      toColumn: 'Category',
    })
  })
})
