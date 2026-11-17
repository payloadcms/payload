import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { runAxeScan } from '../__helpers/e2e/runAxeScan.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { articlesSlug, foldersSlug, pagesSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
let serverURL: string
let payload: PayloadTestSDK<Config>
let editorialID: number | string
let savedPreferences: unknown

test.describe('Hierarchy contents Tree layout', () => {
  test.beforeAll(async ({ browser }) => {
    ;({ serverURL, payload } = await initPayloadE2ENoConfig<Config>({ dirname }))
    const {
      docs: [editorial],
    } = await payload.find({ collection: foldersSlug, where: { title: { equals: 'Editorial' } } })
    editorialID = editorial.id
    const page = await browser.newPage()
    try {
      await initPage({ page, serverURL })
      const response = await page.request.get(
        `${serverURL}/api/payload-preferences/collection-${foldersSlug}`,
      )
      savedPreferences = response.ok() ? (await response.json()).value : undefined
    } finally {
      await page.close()
    }
  })

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage()
    try {
      await initPage({ page, serverURL })
      const url = `${serverURL}/api/payload-preferences/collection-${foldersSlug}`
      const response =
        savedPreferences === undefined
          ? await page.request.delete(url)
          : await page.request.post(url, { data: { value: savedPreferences } })
      expect(response.ok()).toBe(true)
    } finally {
      await page.close()
    }
  })

  test.beforeEach(async ({ page }) => {
    await initPage({ page, serverURL })
    await page.request.post(`${serverURL}/api/payload-preferences/collection-${foldersSlug}`, {
      data: { value: { documentLayout: 'tree' } },
    })
    await page.goto(`${serverURL}/admin/collections/${foldersSlug}?view=hierarchy`)
    await expect(page.locator('.hierarchy-contents-tree')).toBeVisible()
  })

  test('should keep Tree opt-in alongside the existing Table layout', async ({ page }) => {
    await page.getByRole('radio', { name: 'Table', exact: true }).check()
    await expect(page.locator('.hierarchy-contents-tree')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Editorial', exact: true })).toBeVisible()
    await page.getByRole('radio', { name: 'Tree', exact: true }).check()
    await expect(page.locator('.hierarchy-contents-tree')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Unassigned', exact: true })).toBeVisible()
    const editorial = page
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: 'Editorial', exact: true }) })
    await expect(editorial.locator('.icon--folder')).toBeVisible()
  })

  test('should separate unassigned documents and start nested source groups collapsed', async ({
    page,
  }) => {
    await expect(page.getByRole('table', { name: 'Folders', exact: true })).toBeVisible()
    const unassigned = page.getByRole('table', { name: 'Unassigned', exact: true })
    await expect(
      unassigned.getByRole('button', { name: 'Collapse: Pages', exact: true }),
    ).toBeVisible()
    await expect(unassigned.getByRole('link', { name: 'Contact', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Expand: Campaigns', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Expand: Articles', exact: true })).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'A guide to accessible content', exact: true }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: 'Expand: Articles', exact: true }).click()
    await expect(
      page.getByRole('link', { name: 'A guide to accessible content', exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Expand: Campaigns', exact: true }).click()
    await expect(
      page.getByRole('link', { name: 'Campaign announcement', exact: true }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: 'Expand: Articles', exact: true }).click()
    await expect(
      page.getByRole('link', { name: 'Campaign announcement', exact: true }),
    ).toBeVisible()
  })

  test('should page a single source and restore keyboard focus when its action disappears', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await page.getByRole('button', { name: 'Expand: Articles', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: '10 of 12 Articles' })).toBeVisible()
    const loadMore = page.getByRole('button', {
      name: 'Load more: Articles (Editorial)',
      exact: true,
    })
    await loadMore.focus()
    await loadMore.press('Enter')
    await expect(
      page.getByRole('link', { name: 'Working together for a better experience', exact: true }),
    ).toBeVisible()
    await expect(loadMore).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Collapse: Editorial', exact: true }),
    ).toBeFocused()
    await expect(page.getByRole('status').filter({ hasText: '12 of 12 Articles' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'About us', exact: true })).toHaveCount(0)
  })

  test('should retain folder structure when filtering document types', async ({ page }) => {
    await page.getByRole('button', { name: 'Type', exact: true }).click()
    await page.getByRole('menuitemcheckbox', { name: 'Articles', exact: true }).click()
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(new RegExp(`typeFilter=${pagesSlug}`))
    await expect(page.locator('.hierarchy-contents-tree')).toBeVisible()
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Campaigns', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Expand: Pages', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Expand: Articles', exact: true })).toHaveCount(0)
  })

  test('should retry a failed container request and reopen its cached contents', async ({
    page,
  }) => {
    let shouldFail = true
    let requests = 0
    await page.route(`**/admin/collections/${foldersSlug}**`, async (route) => {
      if (route.request().postData()?.includes('hierarchy-contents')) {
        requests++
        if (shouldFail) {
          shouldFail = false
          await route.abort()
          return
        }
      }
      await route.continue()
    })
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expect(page.getByRole('alert').filter({ hasText: "Couldn't load items." })).toBeVisible()
    await page.getByRole('button', { name: 'Retry: Folders (Editorial)', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Expand: Articles', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Collapse: Editorial', exact: true }).click()
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Expand: Articles', exact: true })).toBeVisible()
    expect(requests).toBe(2)
  })

  test('should preserve ancestor navigation and use flat results while searching', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Editorial', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${editorialID}`))
    await page.getByRole('textbox', { name: 'Search by title', exact: true }).fill('guide')
    await expect(page.locator('.hierarchy-contents-tree')).toHaveCount(0)
    await expect(
      page.getByRole('link', { name: 'A guide to accessible content', exact: true }),
    ).toBeVisible()
    await page.getByRole('textbox', { name: 'Search by title', exact: true }).fill('')
    await expect(page.locator('.hierarchy-contents-tree')).toBeVisible()
    await page.getByRole('link', { name: 'Campaigns', exact: true }).click()
    await expect(
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'Editorial', exact: true }),
    ).toBeVisible()
  })

  test('should expose empty, expanded and enhanced contrast states accessibly', async ({
    page,
  }, testInfo) => {
    await page.getByRole('button', { name: 'Expand: Empty folder', exact: true }).focus()
    await page.getByRole('button', { name: 'Expand: Empty folder', exact: true }).press('Enter')
    await expect(page.getByRole('status').filter({ hasText: 'No Results.' })).toBeVisible()
    await page
      .locator('html')
      .evaluate((element) => element.setAttribute('data-enhanced-contrast', ''))
    await expect(page.locator('html')).toHaveAttribute('data-enhanced-contrast', '')
    const result = await runAxeScan({
      page,
      testInfo,
      include: ['.hierarchy-contents-tree'],
      screenshotViolations: false,
    })
    expect(result.violations).toEqual([])
  })
})
