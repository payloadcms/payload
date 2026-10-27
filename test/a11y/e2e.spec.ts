import type { Locator } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

import { waitForFormReady } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { devUser } from '../credentials.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  arrowToWorkflowItem,
  chooseWorkflowUpload,
  cleanupModalMedia,
  cleanupWorkflowUsers,
  createMediaFixture,
  deleteWorkflowPostsByTitle,
  enterWorkflowGrid,
  expectFocusInside,
  expectNoPageOverflow,
  expectPersistedWorkflowPost,
  getFocusIndicatorStyle,
  gotoCreatePost,
  hasRenderedFocusIndicator,
  isPaintedColor,
  openWorkflowDeleteDialog,
  prepareSignInPage,
  prepareWorkflowPage,
  scanA11y,
  tabToSignInControl,
  tabToWorkflowControl,
  withWorkflowPost,
  withWorkflowPosts,
  workflowTabKey,
} from './helpers.js'

let postsURL: AdminUrlUtil
let serverURL: string

test.describe('Admin accessibility', () => {
  test.beforeAll(async () => {
    ;({ serverURL } = await initPayloadE2ENoConfig({
      dirname: fileURLToPath(new URL('.', import.meta.url)),
    }))
    postsURL = new AdminUrlUtil(serverURL, 'posts')
  })

  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    await prepareWorkflowPage({ page, serverURL })
    await page.goto(formatAdminURL({ adminRoute: '/admin', path: '/account', serverURL }))
    const enhancedContrast = page.getByRole('checkbox', {
      name: 'Enhanced Contrast Mode',
      exact: true,
    })

    await enhancedContrast.check()
    await expect(enhancedContrast).toBeChecked()
    await expect(page.locator('html')).toHaveAttribute('data-enhanced-contrast', '')
  })

  test.afterEach(async ({ page }) => {
    try {
      await cleanupModalMedia({ page })
    } finally {
      await cleanupWorkflowUsers({ serverURL })
    }
  })

  test.describe('Sign-in and navigation', () => {
    test('should recover from rejected credentials and sign in using the keyboard', async ({
      page,
    }) => {
      const currentUser = await page.request.get(`${serverURL}/api/users/me`)

      await expect(currentUser).toBeOK()
      const { user } = await currentUser.json()

      await prepareSignInPage({ page, serverURL })
      await expect(page.locator('html')).toHaveAttribute('data-enhanced-contrast', '')
      const email = page.getByRole('textbox', { name: 'Email', exact: true })
      const password = page.getByLabel('Password', { exact: true })
      const submit = page.getByRole('button', { name: 'Login', exact: true })

      await expect(email).toHaveAttribute('required', '')
      await expect(password).toHaveAttribute('aria-required', 'true')
      await scanA11y({ name: 'login', page })
      await tabToSignInControl({ control: email, page })
      await page.keyboard.type(user.email)
      await page.keyboard.press('Tab')
      await expect(password).toBeFocused()
      await page.keyboard.type('incorrect-password')
      await tabToSignInControl({ control: submit, page })
      await page.keyboard.press('Enter')
      const error = page.getByText('The email or password provided is incorrect.')

      await expect(error).toBeVisible()
      const notification = page.locator('[data-sonner-toast]').filter({ has: error })

      // Axe must measure the rendered toast, not its fade-in transition.
      await expect(notification).toHaveCSS('opacity', '1')
      await expect(notification.locator('.toast-content')).toHaveCSS('opacity', '1')
      await scanA11y({ name: 'login with rejected credentials', page })
      // Stay within the form: Sonner restores prior focus when tabbing out of its toast.
      await page.keyboard.press('Shift+Tab')
      await expect(page.getByRole('button', { name: 'Show password', exact: true })).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(password).toBeFocused()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.type(devUser.password)
      await tabToSignInControl({ control: submit, page })
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(formatAdminURL({ adminRoute: '/admin', serverURL }))
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('should bypass repeated navigation and open a collection using the keyboard', async ({
      page,
    }) => {
      await page.goto(formatAdminURL({ adminRoute: '/admin', serverURL }))
      const skip = page.getByRole('link', { name: /skip to (main )?content/i })

      await page.keyboard.press('Tab')
      await expect(skip).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.locator('#payload-main-content')).toBeFocused()
      await scanA11y({ name: 'dashboard', page })
      await scanA11y({ name: 'dashboard collection cards', page, include: ['.collections'] })

      const navigation = page.locator('aside.nav')
      const collections = navigation.getByRole('tab', { name: 'Collections', exact: true })
      const folders = navigation.getByRole('tab', { name: 'Folders', exact: true })

      await tabToWorkflowControl({ control: navigation.getByRole('tab', { selected: true }), page })
      await arrowToWorkflowItem({ item: folders, key: 'ArrowRight', page })
      await expectSidebarTabFocus({ tab: folders })
      await page.keyboard.press('Enter')
      await expect(folders).toHaveAttribute('aria-selected', 'true')
      await arrowToWorkflowItem({ item: collections, key: 'ArrowLeft', page })
      await expectSidebarTabFocus({ tab: collections })
      await page.keyboard.press('Enter')
      await expect(collections).toHaveAttribute('aria-selected', 'true')
      const panel = navigation.getByRole('tabpanel', { name: 'Collections', exact: true })

      await page.keyboard.press('Tab')
      await expectFocusInside({ container: panel, page })
      await expect(panel).not.toBeFocused()
      const posts = page.locator('#nav-posts')

      if (!(await posts.isVisible())) {
        const group = navigation.getByRole('button', { name: 'Collections', exact: true })

        await tabToWorkflowControl({ control: group, page })
        await page.keyboard.press('Enter')
      }
      await tabToWorkflowControl({ control: posts, page })
      await expect
        .poll(async () => {
          const style = await getFocusIndicatorStyle(posts, { pseudoElement: '::before' })

          return (
            style.outlineStyle !== 'none' &&
            Number.parseFloat(style.outlineWidth) > 0 &&
            isPaintedColor(style.outlineColor)
          )
        })
        .toBe(true)
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL((url) => url.pathname === '/admin/collections/posts')
      await expect(posts).toHaveAttribute('aria-current', 'page')
      await expect(page.getByRole('grid', { name: 'Posts', exact: true })).toBeVisible()
    })
    test('should expose full truncated breadcrumb labels without changing their accessible names', async ({
      page,
    }) => {
      await page.goto(
        formatAdminURL({ adminRoute: '/admin', path: '/breadcrumb-current-page', serverURL }),
      )
      const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true })
      const label = 'Parent section of breadcrumb example'
      const parent = breadcrumb.getByRole('link', { name: label, exact: true })

      await expect(parent).toBeVisible()
      await expect
        .poll(() =>
          parent
            .locator('.btn__label')
            .evaluate((element) => element.scrollWidth > element.clientWidth),
        )
        .toBe(true)
      await expect(parent).toHaveAttribute('title', label)
      await tabToWorkflowControl({ control: parent, page })
      await expect(parent).toHaveAccessibleName(label)
      await expect(breadcrumb.locator('span.step-nav__item')).toHaveAttribute(
        'title',
        'Additional breadcrumb context',
      )
      await expect(breadcrumb.locator('[aria-current="page"]')).toHaveAccessibleName(
        'Current breadcrumb example',
      )
      await scanA11y({ name: 'breadcrumb labels', page, include: ['nav.step-nav'] })
    })
  })

  test.describe('Finding content', () => {
    test('should recover from empty search results and open the matching document', async ({
      page,
    }) => {
      await withWorkflowPost({
        action: async ({ id, title }) => {
          await page.goto(
            postsURL.list + qs.stringify({ groupBy: '', search: '' }, { addQueryPrefix: true }),
          )
          const search = page.getByRole('textbox', { name: 'Search', exact: true })

          await tabToWorkflowControl({ control: search, page })
          await page.keyboard.type('no-match-' + randomUUID())
          await expect(page.locator('.no-results__title')).toHaveText('No Results.')
          await expect(search).toBeFocused()
          await scanA11y({
            name: 'empty collection search',
            page,
          })
          await page.keyboard.press('ControlOrMeta+A')
          await page.keyboard.type(title)
          const grid = page.getByRole('grid', { name: 'Posts', exact: true })
          const result = grid.locator('tbody .cell--linked').first()

          await expect(grid.locator('tbody tr')).toHaveCount(1)
          await expect(result).toHaveText(title)
          await expect(search).toBeFocused()
          await enterWorkflowGrid({ grid, page })
          await page.keyboard.press('ArrowDown')
          await page.keyboard.press('ArrowRight')
          await expect(result).toBeFocused()
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL(postsURL.edit(id))
          await expect(page.locator('#field-title')).toHaveValue(title)
        },
        page,
        postsURL,
        serverURL,
      })
    })
    test('should sort and paginate collection results using the keyboard', async ({
      page: workflowPage,
    }) => {
      await withWorkflowPosts({
        action: async (posts) => {
          const query = new URLSearchParams({
            limit: '1',
            sort: '-title',
            'where[id][in]': posts.map(({ id }) => id).join(','),
          })
          await workflowPage.goto(postsURL.list + '?' + query.toString())
          const grid = workflowPage.getByRole('grid', { name: 'Posts', exact: true })
          await expect(grid.locator('tbody .cell-title')).toHaveText(posts[2].title)
          await enterWorkflowGrid({ grid, page: workflowPage })
          const ascending = grid
            .locator('#heading-title')
            .getByRole('button', { name: /ascending/i })
          await arrowToWorkflowItem({ item: ascending, key: 'ArrowRight', page: workflowPage })
          await workflowPage.keyboard.press('Enter')
          await expect(grid.locator('#heading-title')).toHaveAttribute('aria-sort', 'ascending')
          await expect(grid.locator('tbody .cell-title')).toHaveText(posts[0].title)
          await scanA11y({
            name: 'sorted collection list',
            page: workflowPage,
          })
          const next = workflowPage.getByRole('button', { name: 'Next table page', exact: true })
          await tabToWorkflowControl({ control: next, page: workflowPage })
          await workflowPage.keyboard.press('Enter')
          await expect(grid.locator('tbody .cell-title')).toHaveText(posts[1].title)
          await expect(
            workflowPage.getByRole('textbox', { name: 'Go to table page', exact: true }),
          ).toHaveValue('2')
          const previous = workflowPage.getByRole('button', {
            name: 'Previous table page',
            exact: true,
          })
          await tabToWorkflowControl({ control: previous, page: workflowPage })
          await workflowPage.keyboard.press('Enter')
          await expect(grid.locator('tbody .cell-title')).toHaveText(posts[0].title)
          await expect(previous).toBeDisabled()
        },
        labels: ['Alpha', 'Bravo', 'Charlie'],
        page: workflowPage,
        serverURL,
      })
    })
    test('should apply and dismiss collection filters using the keyboard', async ({ page }) => {
      await withWorkflowPosts({
        action: async ([match]) => {
          await page.goto(postsURL.list)
          const trigger = page.getByRole('button', { name: 'Filters', exact: true })

          await tabToWorkflowControl({ control: trigger, page })
          await expect(trigger).toHaveAttribute('aria-expanded', 'false')
          await page.keyboard.press('Enter')
          await expect(trigger).toHaveAttribute('aria-expanded', 'true')
          await expect(trigger).toHaveAttribute('aria-controls', /.+/)
          const panelID = (await trigger.getAttribute('aria-controls'))!

          expect(
            await page
              .locator('[id]')
              .evaluateAll(
                (elements, id) => elements.filter((element) => element.id === id).length,
                panelID,
              ),
          ).toBe(1)
          await expect(page.locator('.where-builder').locator('..')).toHaveAttribute('id', panelID)
          const add = page.getByRole('button', { name: /add filter/i }).first()

          await tabToWorkflowControl({ control: add, page })
          await page.keyboard.press('Enter')
          const builder = page.locator('.where-builder')
          const field = builder.getByRole('combobox', { name: 'Field', exact: true }).first()

          await tabToWorkflowControl({ control: field, page })
          await page.keyboard.type('Title')
          await expect(page.getByRole('option', { name: 'Title', exact: true })).toBeVisible()
          await page.keyboard.press('Home')
          await page.keyboard.press('Enter')
          const operator = builder.getByRole('combobox', { name: 'Filter', exact: true }).first()

          await tabToWorkflowControl({ control: operator, page })
          await page.keyboard.type('equals')
          const equals = page.getByRole('option', { name: 'equals', exact: true })

          await expect(equals).toBeVisible()
          await page.keyboard.press('Home')
          await page.keyboard.press('Enter')
          await expect(
            operator.locator('..').locator('..').locator('.rs__single-value'),
          ).toHaveText('equals')
          const value = builder.getByRole('textbox', { name: 'Title', exact: true }).first()

          await tabToWorkflowControl({ control: value, page })
          await page.keyboard.type(match.title)
          const grid = page.getByRole('grid', { name: 'Posts', exact: true })

          await expect(grid.locator('tbody tr')).toHaveCount(1)
          await expect(grid.locator('tbody .cell-title')).toHaveText(match.title)
          await test.step('focus retention: applying a collection filter should keep focus in its value input', async () => {
            await expect(value).toBeFocused()
          })
          await scanA11y({
            name: 'collection filter builder',
            page,
          })
          await tabToWorkflowControl({ control: trigger, direction: 'Shift+Tab', page })
          await page.keyboard.press('Enter')
          await expect(trigger).toHaveAttribute('aria-expanded', 'false')
          await expect(trigger).toBeFocused()
          await expect(grid.locator('tbody .cell-title')).toHaveText(match.title)
        },
        labels: ['Match', 'Other'],
        page,
        serverURL,
      })
    })
  })

  test.describe('Document editing', () => {
    test('should create a draft through the keyboard and retain it after reload', async ({
      page: workflowPage,
    }) => {
      const title = `Accessibility workflow create ${randomUUID()}`

      try {
        await workflowPage.goto(`${postsURL.list}?locale=en&search=`)
        const create = workflowPage.getByRole('link', { name: 'Create New', exact: true })

        await tabToWorkflowControl({ control: create, page: workflowPage })
        await workflowPage.keyboard.press('Enter')
        await expect(workflowPage).toHaveURL(/\/posts\/create(?:\?|$)/)
        await expect(workflowPage.locator('.collection-edit')).toBeVisible()
        await waitForFormReady(workflowPage)
        await scanA11y({
          name: 'document creation',
          page: workflowPage,
        })
        const input = workflowPage
          .getByRole('textbox', { name: /^Title\b/ })
          .and(workflowPage.locator('#field-title'))

        await tabToWorkflowControl({ control: input, page: workflowPage })
        await workflowPage.keyboard.type(title)
        const save = workflowPage.getByRole('button', { name: 'Save Draft', exact: true })

        await tabToWorkflowControl({ control: save, direction: 'Shift+Tab', page: workflowPage })
        const saved = workflowPage.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === '/api/posts' &&
            response.request().method() === 'POST',
        )

        await workflowPage.keyboard.press('Enter')
        const response = await saved

        await expect.poll(() => response.ok()).toBe(true)
        const { doc } = await response.json()

        await expect(workflowPage).toHaveURL(new RegExp(`/posts/${doc.id}(?:\\?|$)`))
        await expectPersistedWorkflowPost({
          id: doc.id,
          draft: true,
          page: workflowPage,
          serverURL,
          status: 'draft',
          title,
        })
        await workflowPage.reload()
        await expect(input).toHaveValue(title)
      } finally {
        await deleteWorkflowPostsByTitle({ page: workflowPage, serverURL, title })
      }
    })

    test('should identify invalid fields after a keyboard save without discarding valid input', async ({
      page: workflowPage,
    }) => {
      await withWorkflowPost({
        action: async ({ id, title }) => {
          const input = workflowPage
            .getByLabel(/^Title\b/)
            .and(workflowPage.locator('#field-title'))
          const subtitle = workflowPage.getByLabel('Subtitle', { exact: true })
          const retainedValue = `${title} retained input`
          const publish = workflowPage.getByRole('button', { name: /^Publish(?: in English)?$/ })

          await tabToWorkflowControl({ control: input, page: workflowPage })
          await workflowPage.keyboard.press('ControlOrMeta+A')
          await workflowPage.keyboard.press('Backspace')
          await tabToWorkflowControl({ control: subtitle, page: workflowPage })
          await workflowPage.keyboard.type(retainedValue)
          const conditional = workflowPage.getByRole('checkbox', {
            name: 'Show Conditional Note',
            exact: true,
          })

          await tabToWorkflowControl({ control: conditional, page: workflowPage })
          await workflowPage.keyboard.press('Space')
          // Visibility is driven by the server-returned condition, so the last input update
          // has committed before submission; waiting for the RSC stream to close would hang.
          await expect(
            workflowPage.getByRole('textbox', { name: 'Conditional Note', exact: true }),
          ).toBeVisible()
          await tabToWorkflowControl({
            control: publish,
            direction: 'Shift+Tab',
            page: workflowPage,
          })
          await workflowPage.keyboard.press('Enter')
          const error = workflowPage
            .locator('.field-type')
            .filter({ has: input })
            .getByRole('alert')

          await expect(error).toBeVisible()
          await expect(error).toContainText(/required/i)
          await expect(input).toHaveAttribute('aria-invalid', 'true')
          await expect(input).toHaveAccessibleDescription((await error.innerText()).trim())
          await scanA11y({
            name: 'invalid standard document fields',
            page: workflowPage,
            include: ['#field-title', '#field-subtitle', '#field-accessibilitySelect'],
          })
          await expect(subtitle).toHaveValue(retainedValue)
          await expect(conditional).toBeChecked()
          await expectPersistedWorkflowPost({ id, page: workflowPage, serverURL, title })
          await tabToWorkflowControl({ control: input, page: workflowPage })
          await workflowPage.keyboard.type(title)
          await tabToWorkflowControl({
            control: publish,
            direction: 'Shift+Tab',
            page: workflowPage,
          })
          await workflowPage.keyboard.press('Enter')
          await expectPersistedWorkflowPost({
            id,
            page: workflowPage,
            serverURL,
            subtitle: retainedValue,
            title,
          })
          const notification = workflowPage
            .locator('[data-sonner-toast]')
            .filter({ hasText: /successfully|saved|published/i })
            .last()
          await expect(notification).toBeVisible()
          const liveRegion = workflowPage.getByRole('region', { name: 'Notifications alt+T' })
          await expect(liveRegion).toHaveAttribute('aria-live', 'polite')
          await expect(liveRegion).toContainText(/successfully|saved|published/i)
          await workflowPage.reload()
          await expect(subtitle).toHaveValue(retainedValue)
          await expect(conditional).toBeChecked()
          await expect(input).not.toHaveAttribute('aria-invalid', 'true')
        },
        page: workflowPage,
        postsURL,
        serverURL,
      })
    })

    test('should keep unsaved input when keyboard navigation is cancelled', async ({
      page: workflowPage,
    }) => {
      await withWorkflowPost({
        action: async ({ id, title }) => {
          const subtitle = workflowPage.getByLabel('Subtitle', { exact: true })
          const value = `${title} unsaved change`
          const baselineResponse = await workflowPage.request.get(`${serverURL}/api/posts/${id}`)
          const baselineSubtitle = (await baselineResponse.json()).subtitle ?? null

          await tabToWorkflowControl({ control: subtitle, page: workflowPage })
          await workflowPage.keyboard.type(value)
          const breadcrumb = workflowPage
            .locator('.step-nav')
            .getByRole('link', { name: 'Posts', exact: true })

          await tabToWorkflowControl({
            control: breadcrumb,
            direction: 'Shift+Tab',
            page: workflowPage,
          })
          await workflowPage.keyboard.press('Enter')
          const dialog = workflowPage.getByRole('dialog', {
            name: 'Leave without saving',
            exact: true,
          })

          await expectFocusInside({ container: dialog, page: workflowPage })
          await expect(dialog).toContainText(/changes.*not.*saved|unsaved/i)
          await scanA11y({
            name: 'unsaved changes dialog',
            page: workflowPage,
          })
          const stay = dialog.getByRole('button', { name: 'Stay on this page', exact: true })

          await tabToWorkflowControl({ control: stay, page: workflowPage })
          await workflowPage.keyboard.press('Enter')
          await expect(dialog).toBeHidden()
          await expect(workflowPage).toHaveURL(postsURL.edit(id))
          await expect(subtitle).toHaveValue(value)
          await expect(breadcrumb).toBeFocused()
          await expectPersistedWorkflowPost({ id, page: workflowPage, serverURL, title })
          await expect
            .poll(async () => {
              const response = await workflowPage.request.get(
                `${serverURL}/api/posts/${id}?draft=true`,
              )

              return (await response.json()).subtitle ?? null
            })
            .toBe(baselineSubtitle)
        },
        page: workflowPage,
        postsURL,
        serverURL,
      })
    })
  })

  test.describe('Document editing with touch input', () => {
    test.use({ hasTouch: true })

    test('should clear a selected timezone with touch and keyboard and retain input focus', async ({
      page,
    }) => {
      await gotoCreatePost({ page, postsURL })
      const timezone = page.getByRole('combobox', { name: 'Timezone', exact: true }).first()

      await timezone.press('ArrowDown')
      await expect(page.getByRole('option').first()).toBeVisible()
      await timezone.press('Enter')
      const clear = page.getByRole('button', { name: 'Clear Timezone', exact: true })

      await expect(clear).toBeVisible()
      await clear.tap()
      await expect(clear).toBeHidden()
      await expect(timezone).toBeFocused()
      await expect(page.locator('.timezone-picker .rs__single-value')).toHaveCount(0)

      await timezone.press('ArrowDown')
      await expect(page.getByRole('option').first()).toBeVisible()
      await timezone.press('Enter')
      await clear.focus()
      await clear.press('Space')
      await expect(clear).toBeHidden()
      await expect(timezone).toBeFocused()
    })
  })

  test.describe('Complex fields', () => {
    test('should navigate tabs and reveal conditional content without losing focus', async ({
      page,
    }) => {
      await gotoCreatePost({ page, postsURL })
      const first = page.getByRole('tab', { name: 'Post details', exact: true })
      const second = page.getByRole('tab', { name: 'Post summary', exact: true })

      await tabToWorkflowControl({ control: first, page })
      await page.keyboard.press('ArrowRight')
      await expect(second).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(second).toHaveAttribute('aria-selected', 'true')
      await expect(first).toHaveAttribute('aria-selected', 'false')
      const summary = page.getByRole('textbox', { name: 'Tab Summary', exact: true })

      await tabToWorkflowControl({ control: summary, page })
      await page.keyboard.type('Keyboard summary')
      const toggle = page.getByRole('checkbox', { name: 'Show Conditional Note', exact: true })

      await tabToWorkflowControl({ control: toggle, page })
      await expect(
        page.getByRole('textbox', { name: 'Conditional Note', exact: true }),
      ).toHaveCount(0)
      await page.keyboard.press('Space')
      await expect(toggle).toBeChecked()
      await expect(toggle).toBeFocused()
      const note = page.getByRole('textbox', { name: 'Conditional Note', exact: true })

      await tabToWorkflowControl({ control: note, page })
      await page.keyboard.type('Revealed by keyboard')
      await scanA11y({
        name: 'conditional field revealed',
        page,
        include: ['#field-showConditionalNote', '#field-conditionalNote'],
      })
    })

    for (const kind of ['Array', 'Blocks'] as const) {
      test(`should add, reorder and remove ${kind.toLowerCase()} rows using the keyboard`, async ({
        page,
      }) => {
        await withWorkflowPost({
          page,
          postsURL,
          serverURL,
          action: async ({ id }) => {
            const field = page.locator(kind === 'Array' ? '#field-items' : '#field-layout')
            const rows = field.locator(
              kind === 'Array' ? '.array-field__row' : '.blocks-field__row',
            )
            const add = field.locator(
              kind === 'Array' ? '.array-field__add-row' : ':scope > .blocks-field__drawer-toggler',
            )

            const values = ['First row', 'Second row']

            // Finish adding rows before typing can queue a stale one-row form-state response.
            for (const [index] of values.entries()) {
              await tabToWorkflowControl({ control: add, page })
              await page.keyboard.press('Enter')
              if (kind === 'Blocks') {
                const drawer = page.locator('dialog[open]').last()
                const choice = drawer.getByRole('button', { name: 'Text block', exact: true })

                await tabToWorkflowControl({ control: choice, page })
                await page.keyboard.press('Enter')
                const insert = drawer.getByRole('button', { name: 'Insert', exact: true })

                await tabToWorkflowControl({ control: insert, page })
                await page.keyboard.press('Enter')
                await expect(drawer).toBeHidden()
              }
              await expect(rows).toHaveCount(index + 1)
              await expect(
                rows
                  .nth(index)
                  .getByRole('textbox', { name: kind === 'Array' ? 'Label' : 'Text', exact: true }),
              ).toBeVisible()
            }
            for (const [index, value] of values.entries()) {
              const input = rows
                .nth(index)
                .getByRole('textbox', { name: kind === 'Array' ? 'Label' : 'Text', exact: true })

              await tabToWorkflowControl({ control: input, page })
              await page.keyboard.type(value)
            }
            await expect(rows).toHaveCount(2)
            const firstActions = rows.first().locator('.array-actions__button')

            await tabToWorkflowControl({ control: firstActions, direction: 'Shift+Tab', page })
            await page.keyboard.press('Enter')
            const move = page.getByRole('menuitem', { name: 'Move Down', exact: true })

            await arrowToWorkflowItem({ item: move, page })
            await page.keyboard.press('Enter')
            await expect(
              rows
                .first()
                .getByRole('textbox', { name: kind === 'Array' ? 'Label' : 'Text', exact: true }),
            ).toHaveValue('Second row')
            const actions = rows.last().locator('.array-actions__button')

            await tabToWorkflowControl({ control: actions, page })
            await page.keyboard.press('Enter')
            const remove = page.getByRole('menuitem', { name: 'Remove', exact: true })

            await arrowToWorkflowItem({ item: remove, page })
            await page.keyboard.press('Enter')
            await expect(rows).toHaveCount(1)
            await expect(
              rows
                .first()
                .getByRole('textbox', { name: kind === 'Array' ? 'Label' : 'Text', exact: true }),
            ).toHaveValue('Second row')
            await scanA11y({
              name: `${kind} rows after keyboard changes`,
              page,
            })
            const publish = page.getByRole('button', { name: /^Publish(?: in English)?$/ })

            await tabToWorkflowControl({ control: publish, direction: 'Shift+Tab', page })
            await page.keyboard.press('Enter')
            await expect
              .poll(async () => {
                const response = await page.request.get(`${serverURL}/api/posts/${id}?depth=0`)
                const doc = await response.json()

                return kind === 'Array'
                  ? doc.items?.map((row: { label: string }) => row.label)
                  : doc.layout?.map((row: { text: string }) => row.text)
              })
              .toEqual(['Second row'])
            await page.reload()
            await expect(rows).toHaveCount(1)
            const show = field.getByRole('button', { name: /show all/i })

            await tabToWorkflowControl({ control: show, page })
            await page.keyboard.press('Enter')
            await expect(
              rows
                .first()
                .getByRole('textbox', { name: kind === 'Array' ? 'Label' : 'Text', exact: true }),
            ).toHaveValue('Second row')
          },
        })
      })
    }
  })

  test.describe('Relationships and drawers', () => {
    test('should select and remove a related post using the keyboard', async ({
      page: workflowPage,
    }) => {
      await withWorkflowPosts({
        action: async ([related, { id }]) => {
          await workflowPage.goto(postsURL.edit(id))
          await waitForFormReady(workflowPage)
          const field = workflowPage.locator('#field-relatedPost')
          const input = field.getByRole('combobox')

          await tabToWorkflowControl({ control: input, page: workflowPage })
          await expect(input).toHaveAccessibleName('Related Post')
          await workflowPage.keyboard.type(related.title)
          const option = workflowPage.getByRole('option', {
            name: related.title,
            exact: true,
          })

          await expect(option).toBeVisible()
          await scanA11y({
            name: 'relationship options',
            page: workflowPage,
          })
          await workflowPage.keyboard.press('ArrowDown')
          await workflowPage.keyboard.press('Enter')
          await expect(field.locator('.rs__single-value')).toHaveText(related.title)
          const publish = workflowPage.getByRole('button', { name: /^Publish(?: in English)?$/ })

          await tabToWorkflowControl({
            control: publish,
            direction: 'Shift+Tab',
            page: workflowPage,
          })
          await workflowPage.keyboard.press('Enter')
          await expect
            .poll(async () => {
              const response = await workflowPage.request.get(
                `${serverURL}/api/posts/${id}?depth=1`,
              )
              const doc = await response.json()

              return doc.relatedPost?.title
            })
            .toBe(related.title)
          await workflowPage.reload()
          await expect(field.locator('.rs__single-value')).toHaveText(related.title)
          const clear = field.getByRole('button', { name: 'Clear', exact: true })

          await tabToWorkflowControl({ control: clear, page: workflowPage })
          await workflowPage.keyboard.press('Space')
          await expect(field.locator('.rs__single-value')).toHaveCount(0)
          await tabToWorkflowControl({
            control: publish,
            direction: 'Shift+Tab',
            page: workflowPage,
          })
          await workflowPage.keyboard.press('Enter')
          await expect
            .poll(
              async () =>
                (
                  await (
                    await workflowPage.request.get(`${serverURL}/api/posts/${id}?depth=0`)
                  ).json()
                ).relatedPost,
            )
            .toBeNull()
          await workflowPage.reload()
          await expect(field.locator('.rs__single-value')).toHaveCount(0)
        },
        labels: ['Related', 'Editor'],
        page: workflowPage,
        serverURL,
      })
    })
    test('should isolate nested relationship drawers and restore focus on dismissal', async ({
      page,
    }) => {
      await gotoCreatePost({ page, postsURL })
      const trigger = page.locator('#relatedPost-add-new button')

      await tabToWorkflowControl({ control: trigger, page })
      await expect(trigger).toHaveAccessibleName(/create|add/i)
      await page.keyboard.press('Enter')
      const parent = page.locator('dialog[id^="doc-drawer_posts_"]').first()

      await expectFocusInside({ container: parent, page })
      await expect(parent).toHaveAccessibleName(/post/i)
      await expect(page.getByRole('main')).toHaveCount(1)
      await expect(parent.getByRole('main')).toBeVisible()
      await expect(parent.locator('[data-form-ready="true"]').first()).toBeVisible()
      const nestedTrigger = parent.locator('#relatedPost-add-new button')

      await tabToWorkflowControl({ control: nestedTrigger, page })
      await page.keyboard.press('Enter')
      const child = page.locator('dialog[id^="doc-drawer_posts_2_"]')

      await expect(page.locator('dialog[id^="doc-drawer_posts_"][open]')).toHaveCount(2)
      await expectFocusInside({ container: child, page })
      await expect(child).toHaveAccessibleName(/post/i)
      await expect(child.locator('[data-form-ready="true"]').first()).toBeVisible()
      const timezoneIDs = await page
        .locator('.timezone-picker input[role="combobox"]')
        .evaluateAll((inputs) => inputs.map((input) => input.id))

      expect(timezoneIDs.length).toBeGreaterThanOrEqual(3)
      expect(new Set(timezoneIDs).size).toBe(timezoneIDs.length)
      await expect(parent.getByRole('textbox')).toHaveCount(0)
      await scanA11y({
        name: 'nested relationship creation drawer',
        page,
      })
      await page.keyboard.press('Escape')
      await expect(child).toBeHidden()
      await expect(nestedTrigger).toBeFocused()
      await expect(parent).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(parent).toBeHidden()
      await expect(trigger).toBeFocused()
      await expect(page.getByRole('main')).toBeVisible()
    })
  })

  test.describe('Media management', () => {
    test('should replace a renamed local image without retaining its previous name', async ({
      page,
    }) => {
      await page.goto(`${serverURL}/admin/collections/media/create`)
      await chooseWorkflowUpload({ page })
      const filename = page.getByLabel('File Name', { exact: true })
      const preview = page.locator('.file-manager__selected-preview').getByRole('img')

      await filename.fill('renamed-image.png')
      await expect(preview).toHaveAccessibleName('renamed-image.png')
      const remove = page.locator('.file-manager__remove')

      await tabToWorkflowControl({ control: remove, direction: 'Shift+Tab', page })
      await page.keyboard.press('Enter')
      await chooseWorkflowUpload({ page })
      await expect(filename).toHaveValue('image.png')
      await expect(preview).toHaveAccessibleName('image.png')
    })

    test('should recover from required alternative text and save an image using the keyboard', async ({
      page: workflowPage,
    }) => {
      const alt = `Accessibility workflow media ${randomUUID()}`

      try {
        await workflowPage.goto(`${serverURL}/admin/collections/media/create`)
        await chooseWorkflowUpload({ page: workflowPage })
        const input = workflowPage.getByLabel(/^Alt\b/)

        await tabToWorkflowControl({ control: input, page: workflowPage })
        await workflowPage.keyboard.press('ControlOrMeta+A')
        await workflowPage.keyboard.press('Backspace')
        const save = workflowPage.getByRole('button', { name: 'Save', exact: true })

        await tabToWorkflowControl({ control: save, direction: 'Shift+Tab', page: workflowPage })
        await workflowPage.keyboard.press('Enter')
        const error = workflowPage.locator('.field-type').filter({ has: input }).getByRole('alert')

        await expect(error).toBeVisible()
        await expect(error).toContainText(/required/i)
        await expect(input).toHaveAttribute('aria-invalid', 'true')
        await expect(input).toHaveAccessibleDescription((await error.innerText()).trim())
        await expect(workflowPage.locator('.file-manager__selected-preview')).toBeVisible()
        await expect(workflowPage.locator('.payload-toast-item[data-front="true"]')).toHaveCSS(
          'opacity',
          '1',
        )
        await scanA11y({
          name: 'invalid media upload form',
          page: workflowPage,
        })
        await tabToWorkflowControl({ control: input, page: workflowPage })
        await workflowPage.keyboard.type(alt)
        await tabToWorkflowControl({ control: save, direction: 'Shift+Tab', page: workflowPage })
        const saved = workflowPage.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === '/api/media' &&
            response.request().method() === 'POST',
        )

        await workflowPage.keyboard.press('Enter')
        const response = await saved

        await expect.poll(() => response.ok()).toBe(true)
        const { doc } = await response.json()

        await expect(workflowPage).toHaveURL(new RegExp(`/media/${doc.id}(?:\\?|$)`))
        await expect
          .poll(async () => {
            const result = await workflowPage.request.get(`${serverURL}/api/media/${doc.id}`)
            const data = await result.json()

            return { alt: data.alt, mimeType: data.mimeType }
          })
          .toEqual({ alt, mimeType: 'image/png' })
        await workflowPage.reload()
        await expect(input).toHaveValue(alt)
      } finally {
        const result = await workflowPage.request.get(`${serverURL}/api/media`, {
          params: { 'where[alt][equals]': alt },
        })

        for (const doc of (await result.json()).docs) {
          await expect(
            await workflowPage.request.delete(`${serverURL}/api/media/${doc.id}`),
          ).toBeOK()
        }
      }
    })

    test('should select and remove an existing image using the keyboard and persist both changes', async ({
      page: workflowPage,
    }) => {
      const media = await createMediaFixture({ page: workflowPage, serverURL })
      try {
        await withWorkflowPost({
          action: async ({ id }) => {
            const field = workflowPage.locator('#field-featuredImage')
            const choose = field.getByRole('button', {
              name: 'Choose from existing',
              exact: true,
            })
            await tabToWorkflowControl({ control: choose, page: workflowPage })
            await workflowPage.keyboard.press('Enter')
            const drawer = workflowPage.locator('.list-drawer:visible')
            await expectFocusInside({ container: drawer, page: workflowPage })
            await scanA11y({
              name: 'media selection drawer',
              page: workflowPage,
            })
            const image = drawer.getByRole('button', {
              name: new RegExp(media.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
            })
            await tabToWorkflowControl({ control: image, page: workflowPage })
            await workflowPage.keyboard.press('Enter')
            await expect(drawer).toBeHidden()
            await expect(field).toContainText(media.filename)
            const publish = workflowPage.getByRole('button', {
              name: /^Publish(?: in English)?$/,
            })
            await tabToWorkflowControl({
              control: publish,
              direction: 'Shift+Tab',
              page: workflowPage,
            })
            const selectionSaved = workflowPage.waitForResponse(
              (response) =>
                response.url().startsWith(`${serverURL}/api/posts/${id}?`) &&
                response.request().method() === 'PATCH',
            )

            await workflowPage.keyboard.press('Enter')
            expect((await selectionSaved).ok()).toBe(true)
            await expect
              .poll(
                async () =>
                  (
                    await (
                      await workflowPage.request.get(`${serverURL}/api/posts/${id}?depth=0`, {
                        maxRetries: 2,
                      })
                    ).json()
                  ).featuredImage,
              )
              .toBe(media.id)
            await workflowPage.reload()
            await expect(field).toContainText(media.filename)
            const remove = field.getByRole('button', { name: /remove/i })
            await tabToWorkflowControl({ control: remove, page: workflowPage })
            await workflowPage.keyboard.press('Enter')
            await expect(field).not.toContainText(media.filename)
            await tabToWorkflowControl({
              control: publish,
              direction: 'Shift+Tab',
              page: workflowPage,
            })
            const removalSaved = workflowPage.waitForResponse(
              (response) =>
                response.url().startsWith(`${serverURL}/api/posts/${id}?`) &&
                response.request().method() === 'PATCH',
            )

            await workflowPage.keyboard.press('Enter')
            expect((await removalSaved).ok()).toBe(true)
            await expect
              .poll(
                async () =>
                  (
                    await (
                      await workflowPage.request.get(`${serverURL}/api/posts/${id}?depth=0`, {
                        maxRetries: 2,
                      })
                    ).json()
                  ).featuredImage,
              )
              .toBeNull()
            await workflowPage.reload()
            await expect(choose).toBeVisible()
          },
          page: workflowPage,
          postsURL,
          serverURL,
        })
      } finally {
        await cleanupModalMedia({ page: workflowPage })
      }
    })
    test('should open bulk upload and restore focus after cancelling', async ({ page }) => {
      await page.goto(
        formatAdminURL({ adminRoute: '/admin', path: '/collections/media', serverURL }),
      )
      const trigger = page.getByRole('button', { name: /bulk upload/i })

      await scanA11y({ name: 'media collection list', page })
      await tabToWorkflowControl({ control: trigger, page })
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: 'Add files', exact: true })

      await expectFocusInside({ container: dialog, page })
      await scanA11y({
        name: 'bulk upload dialog',
        page,
      })
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(trigger).toBeFocused()
    })
  })

  test.describe('Rich-text editing', () => {
    test('should persist keyboard changes to a select and rich-text field', async ({
      page: workflowPage,
    }) => {
      await withWorkflowPost({
        action: async ({ id, title }) => {
          const select = workflowPage.locator('#field-accessibilitySelect')
          const input = select.getByRole('combobox')
          const text = `${title} rich text`

          await tabToWorkflowControl({ control: input, page: workflowPage })
          await workflowPage.keyboard.type('Value Two')
          await expect(
            workflowPage.getByRole('option', { name: 'Value Two', exact: true }),
          ).toBeVisible()
          await workflowPage.keyboard.press('ArrowDown')
          await workflowPage.keyboard.press('Enter')
          await expect(select.locator('.rs__single-value')).toHaveText('Value Two')
          const editor = workflowPage.locator(
            '[data-field-path="content"] [contenteditable="true"]',
          )

          await tabToWorkflowControl({ control: editor, page: workflowPage })
          await workflowPage.keyboard.press('ControlOrMeta+A')
          await workflowPage.keyboard.type(text)
          await expect(editor).toContainText(text)
          await expect(editor).toHaveAccessibleDescription(/Press Escape, then Tab or Shift\+Tab/)
          await scanA11y({
            name: 'edited rich-text form',
            page: workflowPage,
          })
          await workflowPage.keyboard.press('Escape')
          const publish = workflowPage.getByRole('button', { name: /^Publish(?: in English)?$/ })

          await tabToWorkflowControl({
            control: publish,
            direction: 'Shift+Tab',
            page: workflowPage,
          })
          await workflowPage.keyboard.press('Enter')
          await expect
            .poll(async () => {
              const response = await workflowPage.request.get(
                `${serverURL}/api/posts/${id}?depth=0`,
              )
              const doc = await response.json()

              return {
                containsText: JSON.stringify(doc.content).includes(text),
                select: doc.accessibilitySelect,
              }
            })
            .toEqual({ containsText: true, select: 'two' })
          await workflowPage.reload()
          await expect(select.locator('.rs__single-value')).toHaveText('Value Two')
          await expect(editor).toContainText(text)
        },
        page: workflowPage,
        postsURL,
        serverURL,
      })
    })

    test('should navigate the whole rich-text toolbar with arrow keys and one Tab stop', async ({
      page,
    }) => {
      await gotoCreatePost({ page, postsURL })
      const field = page.locator('[data-field-path="content"]')
      const editor = field.locator('[contenteditable="true"]')

      await editor.fill('Toolbar navigation')
      for (const selector of ['.fixed-toolbar', '.inline-toolbar-popup']) {
        if (selector === '.inline-toolbar-popup') {
          await editor.fill('Toolbar navigation')
          await editor.press('ControlOrMeta+a')
        }

        const toolbar = field.locator(selector)
        const buttons = toolbar.locator('button:enabled')

        await expect(buttons.first()).toBeVisible()
        await expect(toolbar.locator('[data-button-key="indentDecrease"]')).toBeDisabled()
        const link = toolbar.locator('[data-button-key="link"]')

        if (selector === '.fixed-toolbar') {
          await expect(link).toBeDisabled()
        } else {
          await expect(link).toBeEnabled()
        }
        await expect.poll(() => buttons.count()).toBeGreaterThan(2)
        const count = await buttons.count()

        await expect
          .poll(() =>
            buttons.evaluateAll(
              (elements) => elements.filter((element) => element.tabIndex >= 0).length,
            ),
          )
          .toBe(1)
        if (selector === '.fixed-toolbar') {
          await editor.press('Escape')
          await page.keyboard.press('Shift+Tab')
          await expect(field.locator(':focus')).toHaveCount(0)
          await expect
            .poll(() =>
              buttons.evaluateAll(
                (elements) => elements.filter((element) => element.tabIndex >= 0).length,
              ),
            )
            .toBe(1)
          await page.keyboard.press('Tab')
        } else {
          // Keep the text selection active while starting outside the floating toolbar.
          const nextControl = field.locator('.insert-paragraph-at-end')

          await nextControl.focus()
          await expect(nextControl).toBeFocused()
          await page.keyboard.press('Shift+Tab')
        }
        await expect(buttons.first()).toBeFocused()
        for (let index = 1; index < count; index++) {
          await page.keyboard.press('ArrowRight')
          await expect(buttons.nth(index)).toBeFocused()
        }
        await page.keyboard.press('ArrowRight')
        await expect(buttons.first()).toBeFocused()
        await page.keyboard.press('ArrowLeft')
        await expect(buttons.last()).toBeFocused()
        await page.keyboard.press('Home')
        await expect(buttons.first()).toBeFocused()
        await page.keyboard.press('End')
        await expect(buttons.last()).toBeFocused()
        await expect
          .poll(() =>
            buttons.evaluateAll(
              (elements) => elements.filter((element) => element.tabIndex >= 0).length,
            ),
          )
          .toBe(1)
        await page.keyboard.press('Tab')
        await expect(toolbar.locator(':focus')).toHaveCount(0)
        if (selector === '.fixed-toolbar') {
          await page.keyboard.press('Escape')
          await page.keyboard.press('Shift+Tab')
          await expect(toolbar.locator(':focus')).toHaveCount(0)
          await expect(buttons.last()).toHaveAttribute('tabindex', '0')
          await page.keyboard.press('Tab')
          await expect(buttons.last()).toBeFocused()
        }
      }
    })
  })

  test.describe('Publishing, versions and deletion', () => {
    test('should publish a draft and inspect its version history using the keyboard', async ({
      page: workflowPage,
    }) => {
      await withWorkflowPost({
        action: async ({ id, title }) => {
          const publish = workflowPage.getByRole('button', { name: /^Publish(?: in English)?$/ })

          await tabToWorkflowControl({ control: publish, page: workflowPage })
          await workflowPage.keyboard.press('Enter')
          await expectPersistedWorkflowPost({
            id,
            page: workflowPage,
            serverURL,
            status: 'published',
            title,
          })
          const versions = workflowPage.getByRole('link', { name: /versions/i }).first()
          await tabToWorkflowControl({ control: versions, page: workflowPage })
          await workflowPage.keyboard.press('Enter')
          const history = workflowPage.getByRole('grid', { name: /versions/i })
          await expect(history).toBeVisible()
          await expect(history.locator('tbody tr').first()).toBeVisible()
          await scanA11y({
            name: 'document version history',
            page: workflowPage,
          })
          await workflowPage.goto(postsURL.edit(id))
          await workflowPage.reload()
          await expect(
            workflowPage.getByLabel(/^Title\b/).and(workflowPage.locator('#field-title')),
          ).toHaveValue(title)
        },
        initialStatus: 'draft',
        page: workflowPage,
        postsURL,
        serverURL,
      })
    })

    test('should trash and restore a post using only the keyboard', async ({
      page: workflowPage,
    }) => {
      await withWorkflowPost({
        action: async ({ id, title }) => {
          const { dialog } = await openWorkflowDeleteDialog({ page: workflowPage })
          const confirm = dialog.getByRole('button', { name: 'Confirm', exact: true })
          await scanA11y({
            name: 'delete confirmation',
            page: workflowPage,
          })

          await tabToWorkflowControl({ control: confirm, page: workflowPage })
          await workflowPage.keyboard.press('Enter')
          await expect(dialog).toBeHidden()
          await expect(workflowPage).toHaveURL(
            (url) => url.origin === serverURL && url.pathname === '/admin/collections/posts',
          )
          await expect
            .poll(async () => {
              const response = await workflowPage.request.get(
                `${serverURL}/api/posts/${id}?trash=true`,
              )

              return (await response.json()).deletedAt
            })
            .toEqual(expect.any(String))
          await workflowPage.goto(postsURL.trashEdit(id))
          const restore = workflowPage.getByRole('button', { name: 'Restore', exact: true })

          await tabToWorkflowControl({ control: restore, page: workflowPage })
          await workflowPage.keyboard.press('Enter')
          const restoration = workflowPage.getByRole('dialog', {
            name: 'Confirm restoration',
            exact: true,
          })

          await expectFocusInside({ container: restoration, page: workflowPage })
          await expect(restoration).toContainText(title)
          await tabToWorkflowControl({
            control: restoration.getByRole('button', { name: 'Confirm', exact: true }),
            page: workflowPage,
          })
          await workflowPage.keyboard.press('Enter')
          await expect(restoration).toBeHidden()
          await expect(workflowPage.locator('.trash-banner')).toBeHidden()
          await expectPersistedWorkflowPost({
            id,
            draft: true,
            page: workflowPage,
            serverURL,
            status: 'draft',
            title,
          })
          await expect
            .poll(async () => {
              const response = await workflowPage.request.get(
                `${serverURL}/api/posts/${id}?draft=true`,
              )

              return (await response.json()).deletedAt
            })
            .toBeNull()
        },
        page: workflowPage,
        postsURL,
        serverURL,
      })
    })

    test('should cycle keyboard focus within a confirmation dialog until it is dismissed', async ({
      page: workflowPage,
    }) => {
      await withWorkflowPost({
        action: async ({ id, title }) => {
          const { dialog } = await openWorkflowDeleteDialog({ page: workflowPage })
          const close = dialog.getByRole('button', { name: /close/i })
          const permanentlyDelete = dialog.getByRole('checkbox', {
            name: 'Skip trash and delete permanently',
            exact: true,
          })
          const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true })
          const confirm = dialog.getByRole('button', { name: 'Confirm', exact: true })

          await expect(dialog).toHaveAccessibleName(/confirm deletion/i)
          await expect(dialog).toContainText(title)
          await expect(dialog.getByRole('heading', { name: /confirm deletion/i })).toBeFocused()
          await workflowPage.keyboard.press(
            workflowTabKey({ direction: 'Tab', page: workflowPage }),
          )
          await expect(close).toBeFocused()
          await workflowPage.keyboard.press(
            workflowTabKey({ direction: 'Shift+Tab', page: workflowPage }),
          )
          await expect(confirm).toBeFocused()
          await workflowPage.keyboard.press(
            workflowTabKey({ direction: 'Tab', page: workflowPage }),
          )
          await expect(close).toBeFocused()
          await workflowPage.keyboard.press(
            workflowTabKey({ direction: 'Tab', page: workflowPage }),
          )
          await expect(permanentlyDelete).toBeFocused()
          await expect(permanentlyDelete).not.toBeChecked()
          await workflowPage.keyboard.press(
            workflowTabKey({ direction: 'Tab', page: workflowPage }),
          )
          await expect(cancel).toBeFocused()
          await workflowPage.keyboard.press(
            workflowTabKey({ direction: 'Tab', page: workflowPage }),
          )
          await expect(confirm).toBeFocused()
          await workflowPage.keyboard.press('Escape')
          await expect(dialog).toBeHidden()
          await expectPersistedWorkflowPost({ id, page: workflowPage, serverURL, title })
        },
        page: workflowPage,
        postsURL,
        serverURL,
      })
    })
  })

  test.describe('Appearance and layout', () => {
    for (const { name, path, ready } of [
      { name: 'dashboard', path: '', ready: '.dashboard' },
      { name: 'document form', path: '/collections/posts/create', ready: '#field-title' },
      { name: 'account', path: '/account', ready: '.auth-fields' },
    ]) {
      test(`should avoid page overflow and operate the sidebar on the ${name} at 320px`, async ({
        page,
      }) => {
        await page.setViewportSize({ height: 720, width: 320 })
        await page.goto(formatAdminURL({ adminRoute: '/admin', path, serverURL }))
        await expect(page.locator(ready)).toBeVisible()
        await expect(page.locator('#payload-main-content')).toBeVisible()
        await expectNoPageOverflow({ page })
        const menu = page.getByRole('button', { name: 'Open Menu', exact: true })

        await tabToWorkflowControl({ control: menu, page })
        const menuBounds = await menu.boundingBox()

        await page.keyboard.press('Enter')
        await expect(page.locator('aside.nav')).toHaveClass(/nav--nav-open/)
        const close = page.getByRole('button', { name: 'Hide sidebar', exact: true })

        await tabToWorkflowControl({ control: close, page })
        await page.keyboard.press('Tab')
        const unfocusedStyle = await getFocusIndicatorStyle(close, { pseudoElement: '::after' })

        await page.keyboard.press('Shift+Tab')
        await expect(close).toBeFocused()
        await expect
          .poll(async () =>
            hasRenderedFocusIndicator({
              focusedStyle: await getFocusIndicatorStyle(close, { pseudoElement: '::after' }),
              unfocusedStyle,
            }),
          )
          .toBe(true)
        await expect
          .poll(() =>
            close.evaluate((element) => {
              const style = getComputedStyle(element, '::after')

              return {
                height: Number.parseFloat(style.height),
                width: Number.parseFloat(style.width),
              }
            }),
          )
          .toEqual({ height: menuBounds!.height, width: menuBounds!.width })
        // Let the final preference write commit before teardown deletes its owner.
        const savedNavigation = page.waitForResponse(
          (response) =>
            response.url() === `${serverURL}/api/payload-preferences/nav` &&
            response.request().method() === 'POST' &&
            response.request().postDataJSON()?.value?.open === false,
        )

        await page.keyboard.press('Enter')
        expect((await savedNavigation).ok()).toBe(true)
        await expect(menu).toHaveAttribute('aria-expanded', 'false')
        await expect(page.locator('aside.nav')).not.toHaveClass(/nav--nav-open/)
        await test.step('focus restoration: closing the mobile sidebar should return focus to its opener', async () => {
          await expect(menu).toBeFocused()
        })
      })
    }

    test('should keep collection list controls within a 320px viewport', async ({ page }) => {
      await page.setViewportSize({ height: 720, width: 320 })
      await page.goto(postsURL.list)
      await expect(page.locator('.list-controls')).toBeVisible()
      await expectNoPageOverflow({ page })
    })

    for (const theme of ['light', 'dark'] as const) {
      test(`should expose readable standard fields and painted keyboard focus in ${theme} theme`, async ({
        page,
      }) => {
        await page.context().addCookies([{ name: 'payload-theme', url: serverURL, value: theme }])
        await gotoCreatePost({ page, postsURL })
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await scanA11y({
          name: `standard document fields in ${theme} theme`,
          page,
          include: ['#field-title', '#field-subtitle', '#field-accessibilitySelect'],
        })
        const title = page
          .getByRole('textbox', { name: /^Title\b/ })
          .and(page.locator('#field-title'))
        const save = page.getByRole('button', { name: 'Save Draft', exact: true })

        for (const control of [title, save]) {
          const unfocusedStyle = await getFocusIndicatorStyle(control)

          await tabToWorkflowControl({ control, page })
          await expect(control).toBeFocused()
          await expect
            .poll(async () =>
              hasRenderedFocusIndicator({
                focusedStyle: await getFocusIndicatorStyle(control),
                unfocusedStyle,
              }),
            )
            .toBe(true)
        }
      })
    }

    test('should retain form content and keyboard operation with increased text spacing', async ({
      page,
    }) => {
      await gotoCreatePost({ page, postsURL })
      const title = page.locator('#field-title')
      const label = page.locator('label[for="field-title"]')

      await page.addStyleTag({
        content: `
    * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
    p { margin-block-end: 2em !important; }
  `,
      })
      await expect(label).toBeVisible()
      await expect(title).toHaveAccessibleName(/^Title\b/)
      await expectNoPageOverflow({ page })
      await tabToWorkflowControl({ control: title, page })
      await page.keyboard.type('Spaced text remains editable')
      await expect(title).toHaveValue('Spaced text remains editable')
      const publish = page.getByRole('button', { name: /^Publish(?: in English)?$/ })

      await tabToWorkflowControl({ control: publish, direction: 'Shift+Tab', page })
      await expect(publish).toBeInViewport()
    })
  })
})

async function expectSidebarTabFocus({ tab }: { tab: Locator }) {
  await expect(tab).toBeFocused()
  await expect
    .poll(async () => {
      const style = await getFocusIndicatorStyle(tab)

      if (style.outlineStyle === 'none' || !isPaintedColor(style.outlineColor)) {
        return false
      }
      return tab.evaluate((element) => {
        const style = getComputedStyle(element)
        const width = Number.parseFloat(style.outlineWidth)
        const extent = Math.max(0, width + Number.parseFloat(style.outlineOffset))
        const bounds = element.getBoundingClientRect()
        const strip = element.closest('.sidebar-tabs__tabs')!.getBoundingClientRect()

        return (
          width > 0 &&
          bounds.left - extent >= strip.left &&
          bounds.right + extent <= strip.right &&
          bounds.top - extent >= strip.top &&
          bounds.bottom + extent <= strip.bottom
        )
      })
    })
    .toBe(true)
}
