import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Config } from './payload-types.js'

import { runAxeScan } from '../__helpers/e2e/runAxeScan.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { campaignArticleTitle, editorialArticleTitles } from './seedData.js'
import { articlesSlug, foldersSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
let serverURL: string

async function expandFolderTypes({ page, title }: { page: Page; title: string }) {
  const folderRow = page
    .getByRole('row')
    .filter({ has: page.getByRole('link', { name: title, exact: true }) })
  const [, parentID] = JSON.parse(await folderRow.getAttribute('data-id'))
  const groups = page.locator(
    `.folder-tree__type[data-parent-id=${JSON.stringify(String(parentID))}]`,
  )
  await expect(groups.first()).toBeVisible()
  const collapsed = groups.locator('button[aria-expanded="false"]')
  while (await collapsed.count()) await collapsed.first().click()
}

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

  test('should initially collapse document types inside newly opened folders', async ({ page }) => {
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    const folders = page.getByRole('region', { name: 'Folders', exact: true })
    await expect(
      folders.getByRole('button', { name: 'Expand: Articles', exact: true }),
    ).toBeVisible()
    await expect(folders.getByRole('button', { name: 'Expand: Pages', exact: true })).toBeVisible()
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[0], exact: true }),
    ).toHaveCount(0)
    await expect(folders.getByRole('link', { name: 'About us', exact: true })).toHaveCount(0)
    await folders.getByRole('button', { name: 'Expand: Articles', exact: true }).press('Enter')
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[0], exact: true }),
    ).toBeVisible()
    await expect(folders.getByRole('link', { name: 'About us', exact: true })).toHaveCount(0)
  })

  test('should separate folders from grouped unassigned documents', async ({ page }) => {
    const folders = page.getByRole('region', { name: 'Folders', exact: true })
    const unassigned = page.getByRole('region', { name: 'Unassigned', exact: true })
    await expect(
      folders.getByRole('button', { name: 'Expand: Editorial', exact: true }),
    ).toBeVisible()
    await expect(unassigned.getByRole('link', { name: 'Academy', exact: true })).toBeVisible()
    await expect(folders.getByRole('link', { name: 'Academy', exact: true })).toHaveCount(0)
    await expect(unassigned.locator('.nested-doc-cell__guides').first()).toBeVisible()
    await folders.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expandFolderTypes({ page, title: 'Editorial' })
    await expect(folders.getByRole('link', { name: 'About us', exact: true })).toBeVisible()
    await expect(unassigned.getByRole('link', { name: 'About us', exact: true })).toHaveCount(0)
  })

  test('should use one folder browser for clean and legacy list URLs', async ({ page }) => {
    for (const query of ['', '?view=all', '?view=hierarchy', '?_h_page-folders=&view=hierarchy']) {
      await page.goto(`${serverURL}/admin/collections/${foldersSlug}${query}`)
      await expect(page.getByRole('radio', { name: 'Tree', exact: true })).toBeChecked()
      await expect(
        page.getByRole('button', { name: 'Expand: Editorial', exact: true }),
      ).toBeVisible()
      await expect(page.locator('#hierarchy-view-pill')).toHaveCount(0)
      await expect(page.getByRole('radio', { name: 'Table', exact: true })).toBeVisible()
      await expect(page.getByRole('radio', { name: 'Grid', exact: true })).toBeVisible()
    }
  })

  test('should return to the root from the sidebar without an empty folder parameter', async ({
    page,
  }) => {
    await page.locator('.folder-tree').getByRole('link', { name: 'Editorial', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.get('_h_page-folders')).not.toBeNull()
    await page.getByRole('tab', { name: 'Folders', exact: true }).click()
    await page.getByRole('treeitem', { name: 'All Folders', exact: true }).click()
    await expect.poll(() => new URL(page.url()).searchParams.has('_h_page-folders')).toBe(false)
    await expect(page.getByRole('button', { name: 'Expand: Editorial', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Unassigned', exact: true })).toBeVisible()
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
    await expandFolderTypes({ page, title: 'Editorial' })
    await expect(page.getByRole('button', { name: 'Expand: Campaigns', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'About us', exact: true })).toBeVisible()
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[0], exact: true }),
    ).toHaveAttribute('href', new RegExp(`/collections/${articlesSlug}/`))
    const beforeCollapse = branchRequests
    await collapse.click()
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[0], exact: true }),
    ).toBeHidden()
    await editorial.click()
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[0], exact: true }),
    ).toBeVisible()
    expect(branchRequests).toBe(beforeCollapse)
    await page.getByRole('button', { name: 'Expand: Campaigns', exact: true }).click()
    await expandFolderTypes({ page, title: 'Campaigns' })
    await expect(page.getByRole('link', { name: campaignArticleTitle, exact: true })).toBeVisible()
    await page.getByRole('link', { name: editorialArticleTitles[0], exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/collections/${articlesSlug}/`))
    await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue(
      editorialArticleTitles[0],
    )
  })

  test('should retain folders and filter document types throughout the tree', async ({ page }) => {
    await page.goto(`${serverURL}/admin/collections/${foldersSlug}?typeFilter=${articlesSlug}`)
    await expect(page.locator('.folder-tree')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Academy', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expandFolderTypes({ page, title: 'Editorial' })
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[0], exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'About us', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Expand: Campaigns', exact: true }).click()
    await expandFolderTypes({ page, title: 'Campaigns' })
    await expect(page.getByRole('link', { name: campaignArticleTitle, exact: true })).toBeVisible()
    await page.getByRole('button', { name: /Load more: Articles/ }).click()
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[11], exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'About us', exact: true })).toHaveCount(0)
  })

  test('should control ancestor guides with CSS while preserving group connectors', async ({
    page,
  }, testInfo) => {
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expandFolderTypes({ page, title: 'Editorial' })
    const editorialRow = page.getByRole('row').filter({
      has: page.getByRole('button', { name: 'Collapse: Editorial', exact: true }),
    })
    await expect(editorialRow.locator('.nested-doc-cell__root-spine')).toHaveCSS(
      'border-block-end-width',
      '0px',
    )
    await expect
      .poll(() =>
        editorialRow.locator('.nested-doc-cell__root-spine').evaluate((element) => ({
          style: getComputedStyle(element, '::before').borderInlineStartStyle,
          opacity: getComputedStyle(element, '::before').opacity,
        })),
      )
      .toEqual({ style: 'dashed', opacity: '1' })
    await page.getByRole('button', { name: 'Expand: Campaigns', exact: true }).click()
    await expandFolderTypes({ page, title: 'Campaigns' })
    const announcementRow = page.getByRole('row').filter({
      has: page.getByRole('link', { name: campaignArticleTitle, exact: true }),
    })
    await expect(announcementRow.locator('.nested-doc-cell__guide--ancestor')).toBeVisible()
    await expect(announcementRow.locator('.nested-doc-cell__guide--ancestor')).toHaveCSS(
      'opacity',
      '1',
    )
    const tree = page.locator('.folder-tree')
    await tree.evaluate((element) =>
      element.style.setProperty('--folder-tree-ghost-line-opacity', '0.4'),
    )
    await expect(announcementRow.locator('.nested-doc-cell__guide--ancestor')).toHaveCSS(
      'opacity',
      '0.4',
    )
    await expect(announcementRow.locator('.nested-doc-cell__root-spine--ancestor')).toHaveCSS(
      'opacity',
      '0.4',
    )
    await expect
      .poll(() =>
        editorialRow
          .locator('.nested-doc-cell__root-spine')
          .evaluate((element) => getComputedStyle(element, '::before').opacity),
      )
      .toBe('0.4')
    await expect(announcementRow.locator('.nested-doc-cell__guide--elbow')).toHaveCSS(
      'opacity',
      '1',
    )
    await tree.evaluate((element) =>
      element.style.removeProperty('--folder-tree-ghost-line-opacity'),
    )
    await expect(announcementRow.locator('.nested-doc-cell__guide--ancestor')).toHaveCSS(
      'opacity',
      '1',
    )
    const typeRow = page.locator('.folder-tree__type').filter({ hasText: 'Articles' }).first()
    await expect(typeRow.locator('.folder-tree__type-label')).toHaveText('Articles')
    await expect(typeRow.locator('.pill')).toHaveText('Articles')
    await expect(announcementRow.locator('.nested-doc-cell')).toHaveCSS('--nested-doc-depth', '2')
    await expect(typeRow.locator('.nested-doc-cell')).toHaveCSS('--nested-doc-depth', '2')
    await expect(typeRow.locator('.nested-doc-cell__guide--stem')).toBeHidden()
    await expect(typeRow.locator('.nested-doc-cell__guide--elbow')).not.toHaveClass(/guide--last/)
    const toggleBounds = await typeRow.locator('.nested-doc-cell__toggle').boundingBox()
    const guideBounds = await typeRow.locator('.nested-doc-cell__guide--elbow').boundingBox()
    expect(Math.abs(toggleBounds.x + toggleBounds.width / 2 - guideBounds.x)).toBeLessThanOrEqual(1)
    await expect(announcementRow).not.toHaveCSS('border-block-start-color', 'rgba(0, 0, 0, 0)')
    await expect(typeRow).not.toHaveCSS('border-block-start-color', 'rgba(0, 0, 0, 0)')
    await expect(editorialRow).not.toHaveCSS('border-block-start-color', 'rgba(0, 0, 0, 0)')
    const groupToggle = typeRow.getByRole('button', {
      name: 'Collapse: Articles',
      exact: true,
    })
    await groupToggle.focus()
    await page.keyboard.press('Enter')
    await expect(announcementRow).toHaveCount(0)
    await typeRow.getByRole('button', { name: 'Expand: Articles', exact: true }).press('Enter')
    await expect(announcementRow).toBeVisible()
    const summaryRow = announcementRow.locator('xpath=following-sibling::tr[1]')
    await expect(summaryRow).toHaveText('1 of 1 Articles')
    await expect(summaryRow.locator('.pill')).toHaveCount(0)
    await expect(summaryRow.locator('.nested-doc-cell__guide--ancestor')).toBeVisible()
    await expect(summaryRow.locator('.nested-doc-cell__guide--elbow')).toHaveCSS(
      'border-inline-start-style',
      'solid',
    )
    await expect(summaryRow.locator('.nested-doc-cell__guide--elbow')).toHaveCSS(
      'border-block-end-width',
      '0px',
    )
    await expect
      .poll(() =>
        summaryRow
          .locator('.nested-doc-cell__guides')
          .evaluate((element) => getComputedStyle(element, '::after').inlineSize),
      )
      .toBe('24px')
    const continuingSummary = page.locator('.folder-tree__summary').filter({ hasText: '10 of 12' })
    await expect(continuingSummary.locator('.nested-doc-cell__guide--elbow')).toHaveCSS(
      'border-inline-start-style',
      'solid',
    )
    await expect(continuingSummary.locator('.nested-doc-cell__guide--elbow')).not.toHaveClass(
      /guide--last/,
    )
    const nextTypeRow = continuingSummary.locator('xpath=following-sibling::tr[1]')
    await expect(nextTypeRow.locator('.folder-tree__type-label')).toHaveText('Pages')
    await expect
      .poll(async () => {
        const lowerGuide = await continuingSummary
          .locator('.nested-doc-cell__guide--elbow')
          .boundingBox()
        const upperGuide = await nextTypeRow.locator('.nested-doc-cell__guide--elbow').boundingBox()
        return Math.abs(lowerGuide.y + lowerGuide.height - upperGuide.y)
      })
      .toBeLessThanOrEqual(1)
    await page.screenshot({
      path: testInfo.outputPath('folder-tree-ancestor-connector.png'),
      fullPage: true,
    })
  })

  test('should stop connectors at the last collapsed type and final summary', async ({
    page,
  }, testInfo) => {
    const folders = page.getByRole('region', { name: 'Folders', exact: true })
    await folders.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expandFolderTypes({ page, title: 'Editorial' })
    const typeRow = folders.locator('.folder-tree__type').filter({ hasText: 'Pages' })
    const pagesToggle = typeRow.getByRole('button', { name: 'Collapse: Pages', exact: true })
    await pagesToggle.click()
    await expect(typeRow.locator('.nested-doc-cell__guide--elbow')).toHaveClass(/guide--last/)
    await expect(typeRow.locator('.nested-doc-cell__guide--elbow')).toHaveCSS(
      'border-block-end-width',
      '0px',
    )
    await expect
      .poll(async () => {
        const guide = await typeRow.locator('.nested-doc-cell__guide--elbow').boundingBox()
        const toggle = await typeRow.getByRole('button').boundingBox()
        return Math.abs(guide.y + guide.height - toggle.y - toggle.height / 2)
      })
      .toBeLessThanOrEqual(1)
    const unassigned = page.getByRole('region', { name: 'Unassigned', exact: true })
    const summary = unassigned.locator('.folder-tree__summary').last()
    await expect(summary.locator('.nested-doc-cell__root-spine')).toHaveClass(/guide--last/)
    await expect
      .poll(async () => {
        const guide = await summary.locator('.nested-doc-cell__root-spine').boundingBox()
        const row = await summary.boundingBox()
        return Math.abs(guide.y + guide.height - row.y - row.height / 2)
      })
      .toBeLessThanOrEqual(1)
    await page.screenshot({
      path: testInfo.outputPath('folder-tree-connector-endings.png'),
      fullPage: true,
    })
  })

  test('should keep horizontal connectors stationary when folders open and close', async ({
    page,
  }) => {
    const checkConnector = async ({ title }: { title: string }) => {
      const row = page
        .getByRole('row')
        .filter({ has: page.getByRole('link', { name: title, exact: true }) })
      const horizontalPosition = () =>
        row.locator('.nested-doc-cell').evaluate((cell) => {
          const guides = cell.querySelector('.nested-doc-cell__guides')
          for (const verticalGuide of cell.querySelectorAll(
            '.nested-doc-cell__root-spine, .nested-doc-cell__guide--elbow',
          )) {
            if (getComputedStyle(verticalGuide).borderBottomWidth !== '0px')
              throw new Error('Duplicate horizontal border')
          }
          for (const legacyGuide of cell.querySelectorAll(
            '.nested-doc-cell__guide--elbow, .nested-doc-cell__guide--root',
          )) {
            if (getComputedStyle(legacyGuide, '::after').content !== 'none')
              throw new Error('Duplicate horizontal connector')
          }
          const horizontal = getComputedStyle(guides, '::after')
          if (horizontal.content === 'none') throw new Error('Missing horizontal connector')
          return (
            guides.getBoundingClientRect().top +
            Number.parseFloat(horizontal.top) -
            cell.closest('tr').getBoundingClientRect().top
          )
        })
      const before = await horizontalPosition()
      await row.getByRole('button', { name: `Expand: ${title}`, exact: true }).click()
      await expect(
        row.getByRole('button', { name: `Collapse: ${title}`, exact: true }),
      ).toBeVisible()
      await expect
        .poll(async () => Math.abs((await horizontalPosition()) - before))
        .toBeLessThan(0.1)
      await row.getByRole('button', { name: `Collapse: ${title}`, exact: true }).click()
      await expect
        .poll(async () => Math.abs((await horizontalPosition()) - before))
        .toBeLessThan(0.1)
    }
    await checkConnector({ title: 'Editorial' })
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expandFolderTypes({ page, title: 'Editorial' })
    await checkConnector({ title: 'Campaigns' })
    await checkConnector({ title: 'Empty folder' })
  })

  test('should show row backgrounds for pointer hover and keyboard focus', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Expand: Editorial', exact: true })
    const row = page.getByRole('row').filter({ has: button })
    await button.hover()
    await expect(row).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await button.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(button).toBeFocused()
    await expect(row).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  })

  test('should page one content source without replacing sibling sources', async ({ page }) => {
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expandFolderTypes({ page, title: 'Editorial' })
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[9], exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[10], exact: true }),
    ).toBeHidden()
    await page.getByRole('button', { name: /Load more: Articles/ }).click()
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[11], exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[0], exact: true }),
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
      ).toHaveCount(0)
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
    await expect(page.locator('.folder-tree').getByRole('alert')).toBeHidden()
    await expect(
      page.getByRole('button', { name: 'Collapse: Editorial', exact: true }),
    ).toBeFocused()
    await expandFolderTypes({ page, title: 'Editorial' })
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[0], exact: true }),
    ).toBeVisible()
  })

  test('should show an empty branch and accessible mixed content in enhanced contrast', async ({
    page,
  }, testInfo) => {
    await page.getByRole('button', { name: 'Expand: Empty folder', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'No Results.' })).toBeVisible()
    const emptyRow = page
      .getByRole('row')
      .filter({ has: page.getByRole('status').filter({ hasText: 'No Results.' }) })
    await expect(emptyRow.locator('.nested-doc-cell__root-spine--ancestor')).toBeHidden()
    const emptyFolderRow = page
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: 'Empty folder', exact: true }) })
    await expect
      .poll(() =>
        emptyFolderRow
          .locator('.nested-doc-cell__root-spine')
          .evaluate((element) => getComputedStyle(element, '::before').content),
      )
      .toBe('none')
    await page.getByRole('button', { name: 'Expand: Editorial', exact: true }).click()
    await expandFolderTypes({ page, title: 'Editorial' })
    await expect(
      page.getByRole('link', { name: editorialArticleTitles[0], exact: true }),
    ).toBeVisible()
    await page.evaluate(() =>
      document.documentElement.setAttribute('data-enhanced-contrast', 'true'),
    )
    const results = await runAxeScan({ page, testInfo, include: ['.folder-tree'] })
    expect(results.violations).toEqual([])
    await page.screenshot({ path: testInfo.outputPath('folder-tree-expanded.png'), fullPage: true })
  })
})
