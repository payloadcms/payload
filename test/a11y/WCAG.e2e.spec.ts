import type { Locator, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { formatAdminURL, instructionsCollectionSlug } from 'payload/shared'

import type { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'

import { addGroupBy, clearGroupBy, openGroupBy } from '../__helpers/e2e/groupBy/index.js'
import { waitForFormReady } from '../__helpers/e2e/helpers.js'
import { runAxeScan } from '../__helpers/e2e/runAxeScan.js'
import { getSelectMenu, selectInput } from '../__helpers/e2e/selectInput.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { seededAPIKey } from './constants.js'
import {
  addCollectionQueryWidget,
  addTextBlock,
  cleanupModalMedia,
  createMediaFixture,
  expectFocusInside,
  expectOptionsToHaveAccessibleNames,
  expectPaintedFocus,
  getFocusIndicatorStyle,
  getTextContrastRatios,
  gotoCreatePost,
  gotoFirstPost,
  gotoPostsList,
  hasRenderedFocusIndicator,
  insertTextBlockWithKeyboard,
  openAccessibilityTestPage,
  openAPIKeyDialog,
  openBlockDatePicker,
  openBulkEditFieldSelect,
  openBulkUploadDialog,
  openCopyToLocaleDrawer,
  openDashboardEditor,
  openDragReorderField,
  openDrawerFilters,
  openEditImageDialog,
  openFirstBlockActions,
  openFolderCreationLocation,
  openGlobalAPI,
  openLivePreview,
  openLLMInstructions,
  openLocaleOptions,
  openNavigation,
  openNavigationFolders,
  openPopupWithKeyboard,
  openPostsFilter,
  openRelationshipCreationDrawer,
  openRichTextRelationshipDrawer,
  openRichTextUploadDrawer,
  openTableColumns,
  openTableVersionHistory,
  openVersionComparison,
  openVersionsList,
  openWidgetDrawer,
  waitForFocusRestoration,
  waitForKeyboardDragActivation,
} from './helpers.js'

const openNavigationForUserMenu = async ({ page }: { page: Page }): Promise<void> => {
  await openNavigation({ page })
  await expect(page.locator('.user-menu__trigger')).toBeVisible()
}

test.describe('WCAG 2.2 Level AA', () => {
  let page: Page
  let postsURL: AdminUrlUtil
  let serverURL: string
  const dashboardCleanup: Array<() => Promise<void>> = []

  test.beforeAll(async ({ browser }, testInfo) => {
    ;({ page, postsURL, serverURL } = await openAccessibilityTestPage({
      browser,
      testInfo,
    }))
  })

  test.afterEach(async () => {
    const restore = dashboardCleanup.splice(0).reverse()

    for (const cleanup of restore) {
      await cleanup()
    }
    await cleanupModalMedia({ page })
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  test.describe('1.1.1 Non-text Content (A)', () => {
    test('should expose the default login logo as an image named Payload', async ({ browser }) => {
      // PYLD-3609: expose the static logo without adding a keyboard Tab stop.
      const loginPage = await browser.newPage({
        extraHTTPHeaders: { DisableAutologin: 'true' },
      })

      try {
        await loginPage.goto(formatAdminURL({ adminRoute: '/admin', path: '/login', serverURL }))
        const logo = loginPage.getByRole('img', { name: 'Payload', exact: true })

        await expect(logo).toBeVisible()
        expect(await logo.evaluate((element) => element.tabIndex)).toBe(-1)
      } finally {
        await loginPage.close()
      }
    })
  })

  test.describe('1.3.1 Info and Relationships (A)', () => {
    for (const { name, path, title } of [
      { name: 'dashboard', path: '', title: /^Welcome, / },
      { name: 'collection list', path: '/collections/posts', title: 'Posts' },
      { name: 'collection creation', path: '/collections/posts/create', title: 'Untitled' },
      { name: 'global edit', path: '/globals/menu', title: 'Menu' },
    ]) {
      test(`should expose the ${name} main page title as a level-one heading`, async () => {
        // PYLD-3640
        await page.goto(formatAdminURL({ adminRoute: '/admin', path, serverURL }))
        if (path.endsWith('/create') || path.startsWith('/globals/')) {
          await waitForFormReady(page)
        }

        await expect(
          page.getByRole('heading', { name: title, exact: true, level: 1 }),
        ).toBeVisible()
      })
    }

    test('should expose the existing document main page title as a level-one heading', async () => {
      // Additional coverage for PYLD-3640.
      await gotoFirstPost({ page, postsURL, serverURL })

      await expect(
        page.getByRole('heading', {
          name: 'Example post one, third version',
          exact: true,
          level: 1,
        }),
      ).toBeVisible()
    })

    test('should expose the empty search result title as a heading in a versioned field collection', async () => {
      // PYLD-3691, PYLD-3706
      await gotoPostsList({ page, postsURL })
      await expect(page.locator('tbody tr').first()).toBeVisible()
      await page.locator('#search-filter-input').fill('heading-label-no-matching-post')
      const title = page.locator('.no-results__title')

      await expect(title).toHaveText('No Results.')
      await expect(page.locator('tbody tr')).toHaveCount(0)
      await expect(title).toHaveRole('heading')
      await expect(title).toHaveAccessibleName('No Results.')
    })

    test('should expose one banner or distinguish repeated banners on the field collection', async () => {
      // PYLD-3698
      await gotoPostsList({ page, postsURL })
      await openNavigation({ page })
      await expect(page.locator('.app-header')).toBeVisible()
      const banners = page.getByRole('banner')
      const count = await banners.count()

      expect(count).toBeGreaterThan(0)
      if (count > 1) {
        const names: string[] = []

        for (const banner of await banners.all()) {
          await expect(banner).toHaveAccessibleName(/\S/)
          const snapshot = await banner.ariaSnapshot()
          const name = snapshot.match(/^- banner "(.+?)"(?::|$)/m)?.[1]

          expect(name).toBeTruthy()
          names.push(name!)
        }
        expect(new Set(names).size).toBe(count)
      }
    })

    test('should expose SEO preview metadata without actionable links or a page heading', async () => {
      // PYLD-3832
      await page.goto(formatAdminURL({ adminRoute: '/admin', path: '/globals/menu', serverURL }))
      await waitForFormReady(page)
      await page.locator('#field-meta').scrollIntoViewIfNeeded()
      await page.locator('#field-meta__title').fill('Accessibility search preview title')
      await page
        .locator('#field-meta__description')
        .fill('Accessibility search preview description')
      const preview = page
        .locator('p')
        .filter({ hasText: /^Accessibility search preview description$/ })
        .locator('..')

      await expect(preview).toHaveCount(1)
      await expect(
        preview.getByText('https://example.com/accessibility-post', { exact: true }),
      ).toBeVisible()
      await expect(
        preview.getByText('Accessibility search preview title', { exact: true }),
      ).toBeVisible()
      await expect(
        preview.getByText('Accessibility search preview description', { exact: true }),
      ).toBeVisible()
      await expect.soft(preview.getByRole('link')).toHaveCount(0)
      await expect
        .soft(
          preview.getByRole('heading', { name: 'Accessibility search preview title', exact: true }),
        )
        .toHaveCount(0)
    })

    for (const kind of ['Array', 'Blocks'] as const) {
      test(`should identify the ${kind} row on its drag control`, async ({
        browser: _browser,
      }, testInfo) => {
        // Additional coverage for PYLD-3628
        const { firstRowLabel, handle } = await openDragReorderField({ kind, page, postsURL })

        await expect(handle).toHaveAccessibleName(new RegExp(firstRowLabel, 'i'))
        const scan = await runAxeScan({
          include: [
            kind === 'Array'
              ? '#field-items .collapsible__drag'
              : '#field-layout .collapsible__drag',
          ],
          page,
          testInfo,
        })

        expect(scan.violations).toEqual([])
      })

      test(`should describe pickup movement drop and cancellation for ${kind} dragging`, async () => {
        // Additional coverage for PYLD-3627
        const { handle } = await openDragReorderField({ kind, page, postsURL })

        await expect.soft(handle).toHaveAccessibleDescription(/space|enter/i)
        await expect.soft(handle).toHaveAccessibleDescription(/arrow/i)
        await expect.soft(handle).toHaveAccessibleDescription(/voiceover.*command.*arrow/i)
        await expect.soft(handle).toHaveAccessibleDescription(/drop/i)
        await expect(handle).toHaveAccessibleDescription(/escape|cancel/i)
      })
    }
