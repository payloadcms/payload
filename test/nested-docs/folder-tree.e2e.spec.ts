import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Config } from './payload-types.js'

import { runAxeScan } from '../__helpers/e2e/runAxeScan.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { articlesSlug, foldersSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
let serverURL: string

test.describe('Mixed folder Tree', () => {
  test.beforeAll(async () => {
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  test.beforeEach(async ({ page }) => {
    await initPage({ page, serverURL })
    await page.goto(`${serverURL}/admin/collections/${foldersSlug}?view=hierarchy`)
    await page.getByRole('radio', { name: 'Tree', exact: true }).check()
    await expect(page.getByRole('button', { name: 'Expand: Editorial', exact: true })).toBeVisible()
  })

  test('should expand mixed contents by keyboard and retain cached branches', async ({ page }) => {
    let branchRequests = 0
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (url.pathname.endsWith('/hierarchy-contents') && url.searchParams.has('parentID')) {
        branchRequests++
      }
    })
    const editorial = page.getByRole('button', { name: 'Expand: Editorial', exact: true })
    await editorial.focus()
    await page.keyboard.press('Enter')
    const collapse = page.getByRole('button', { name: 'Collapse: Editorial', exact: true })
    await expect(collapse).toBeFocused()
    await expect(page.getByRole('button', { name: 'Expand: Campaigns', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'About us', exact: true })).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Editorial article 01', exact: true }),
    ).toHaveAttribute('href', new RegExp(`/collections/${articlesSlug}/`))
    const beforeCollapse = branchRequests
    await collapse.click()
    await expect(page.getByRole('link', { name: 'Editorial article 01', exact: true })).toBeHidden()
    await editorial.click()
    await expect(
      page.getByRole('link', { name: 'Editorial article 01', exact: true }),
    ).toBeVisible()
    expect(branchRequests).toBe(beforeCollapse)
    await page.getByRole('button', { name: 'Expand: Campaigns', exact: true }).click()
    await expect(
      page.getByRole('link', { name: 'Campaign announcement', exact: true }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Editorial article 01', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/collections/${articlesSlug}/`))
    await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue(
      'Editorial article 01',
    )
  })

  test('should page one content source without replacing sibling sources', async ({ page }) => {
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expect(
      page.getByRole('link', { name: 'Editorial article 10', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Editorial article 11', exact: true })).toBeHidden()
    await page.getByRole('button', { name: /Load more: Nested Articles/ }).click()
    await expect(
      page.getByRole('link', { name: 'Editorial article 12', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Editorial article 01', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'About us', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Expand: Campaigns', exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Collapse: Editorial', exact: true }),
    ).toBeFocused()
  })

  test('should paginate filtered contents through the same authorized source', async ({ page }) => {
    const root = await (
      await page.request.get(`${serverURL}/api/${foldersSlug}/hierarchy-contents`)
    ).json()
    const folder = root.sources
      .find((source) => source.collectionSlug === foldersSlug)
      .docs.find((doc) => doc.title === 'Editorial')
    const ids: (number | string)[] = []
    try {
      for (let index = 1; index <= 26; index++) {
        const response = await page.request.post(`${serverURL}/api/${articlesSlug}`, {
          data: {
            title: `Paging article ${String(index).padStart(2, '0')}`,
            '_h_page-folders': folder.id,
          },
        })
        expect(response.ok()).toBe(true)
        ids.push((await response.json()).doc.id)
      }
      await page.goto(
        `${serverURL}/admin/collections/${foldersSlug}?view=hierarchy&_h_page-folders=${folder.id}&search=Paging`,
      )
      await expect(
        page.getByRole('status').filter({ hasText: 'Showing matching documents' }),
      ).toBeVisible()
      await expect(page.getByRole('link', { name: 'Paging article 10', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Paging article 11', exact: true })).toBeHidden()
      const next = page.getByRole('button', { name: /Next table page/i })
      await next.click()
      await expect(page.getByRole('link', { name: 'Paging article 11', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Paging article 20', exact: true })).toBeVisible()
      await next.click()
      await expect(page.getByRole('link', { name: 'Paging article 21', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Paging article 26', exact: true })).toBeVisible()
    } finally {
      for (const id of ids) {
        await page.request.delete(`${serverURL}/api/${articlesSlug}/${id}`)
      }
    }
  })

  test('should recover from a failed branch request without replacing the folder row', async ({
    page,
  }) => {
    let shouldFail = true
    await page.route('**/hierarchy-contents?*', async (route) => {
      if (new URL(route.request().url()).searchParams.has('parentID') && shouldFail) {
        shouldFail = false
        await route.fulfill({ status: 503, body: '{}' })
      } else {
        await route.continue()
      }
    })
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expect(page.locator('.folder-tree').getByRole('alert')).toBeVisible()
    const retry = page.getByRole('button', { name: /Retry:/ })
    await retry.focus()
    await page.keyboard.press('Enter')
    await expect(
      page.getByRole('link', { name: 'Editorial article 01', exact: true }),
    ).toBeVisible()
    await expect(page.locator('.folder-tree').getByRole('alert')).toBeHidden()
    await expect(
      page.getByRole('button', { name: 'Collapse: Editorial', exact: true }),
    ).toBeFocused()
  })

  test('should show an empty branch and accessible mixed content in enhanced contrast', async ({
    page,
  }, testInfo) => {
    await page.getByRole('button', { name: 'Expand: Empty folder', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'No Results.' })).toBeVisible()
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expect(
      page.getByRole('link', { name: 'Editorial article 01', exact: true }),
    ).toBeVisible()
    await page.evaluate(() =>
      document.documentElement.setAttribute('data-enhanced-contrast', 'true'),
    )
    const results = await runAxeScan({ page, testInfo, include: ['.folder-tree'] })
    expect(results.violations).toEqual([])
    await page.screenshot({ path: testInfo.outputPath('folder-tree-expanded.png'), fullPage: true })
  })
})
