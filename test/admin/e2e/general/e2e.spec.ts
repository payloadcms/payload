import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { formatAdminURL, wait } from 'payload/shared'

import type { Config, Geo, Post } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  getRoutes,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  saveDocHotkeyAndAssert,
  // throttleTest,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import {
  BASE_PATH,
  customAdminRoutes,
  customCollectionMetaTitle,
  customDefaultTabMetaTitle,
  customNestedViewPath,
  customNestedViewTitle,
  customRootViewMetaTitle,
  customTabViewPath,
  customVersionsTabMetaTitle,
  customViewMetaTitle,
  customViewPath,
  customViewTitle,
  protectedCustomNestedViewPath,
  publicCustomViewPath,
  slugPluralLabel,
} from '../../shared.js'
import {
  customViews2CollectionSlug,
  disableCopyToLocale as disableCopyToLocaleSlug,
  disableDuplicateSlug,
  geoCollectionSlug,
  globalSlug,
  notInViewCollectionSlug,
  postsCollectionSlug,
  settingsGlobalSlug,
  uploadTwoCollectionSlug,
} from '../../slugs.js'
process.env.NEXT_BASE_PATH = BASE_PATH

const { beforeAll, beforeEach, describe } = test

const title = 'Title'
const description = 'Description'

let payload: PayloadTestSDK<Config>

import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'

import { navigateToDoc } from '../../../helpers/e2e/navigateToDoc.js'
import { openDocControls } from '../../../helpers/e2e/openDocControls.js'
import { openNav } from '../../../helpers/e2e/toggleNav.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

describe('General', () => {
  let page: Page
  let postsUrl: AdminUrlUtil
  let context: BrowserContext
  let geoUrl: AdminUrlUtil
  let notInViewUrl: AdminUrlUtil
  let globalURL: AdminUrlUtil
  let customViewsURL: AdminUrlUtil
  let disableCopyToLocale: AdminUrlUtil
  let disableDuplicateURL: AdminUrlUtil
  let serverURL: string
  let adminRoutes: ReturnType<typeof getRoutes>
  let adminRoute: string
  let uploadsTwo: AdminUrlUtil

  beforeAll(async ({ browser }, testInfo) => {
    const prebuild = false // Boolean(process.env.CI)

    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      prebuild,
    }))
    postsUrl = new AdminUrlUtil(serverURL, postsCollectionSlug)
    geoUrl = new AdminUrlUtil(serverURL, geoCollectionSlug)
    notInViewUrl = new AdminUrlUtil(serverURL, notInViewCollectionSlug)
    globalURL = new AdminUrlUtil(serverURL, globalSlug)
    customViewsURL = new AdminUrlUtil(serverURL, customViews2CollectionSlug)
    disableCopyToLocale = new AdminUrlUtil(serverURL, disableCopyToLocaleSlug)
    disableDuplicateURL = new AdminUrlUtil(serverURL, disableDuplicateSlug)
    uploadsTwo = new AdminUrlUtil(serverURL, uploadTwoCollectionSlug)

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })

    adminRoutes = getRoutes({ customAdminRoutes })
    adminRoute = adminRoutes.routes.admin
  })

  beforeEach(async () => {
    // await throttleTest({
    //   page,
    //   context,
    //   delay: 'Fast 4G',
    // })

    await reInitializeDB({
      serverURL,
      snapshotKey: 'adminTests',
    })

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })
  })

  describe('metadata', () => {
    describe('root title and description', () => {
      test('should render custom page title suffix', async () => {
        await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
        await expect(page.title()).resolves.toMatch(/- Custom Title Suffix$/)
      })

      test('should render custom meta description from root config', async () => {
        await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
        await expect(page.locator('meta[name="description"]')).toHaveAttribute(
          'content',
          /This is a custom meta description/,
        )
      })

      test('should render custom meta description from collection config', async () => {
        await page.goto(postsUrl.collection(postsCollectionSlug))
        await page.locator('.collection-list .table a').first().click()

        await expect(page.locator('meta[name="description"]')).toHaveAttribute(
          'content',
          /This is a custom meta description for posts/,
        )
      })

      test('should fallback to root meta for custom root views', async () => {
        await page.goto(
          formatAdminURL({
            adminRoute,
            path: '/custom-default-view',
            serverURL,
          }),
        )
        await expect(page.title()).resolves.toMatch(/- Custom Title Suffix$/)
      })

      test('should render custom meta title from custom root views', async () => {
        await page.goto(
          formatAdminURL({
            adminRoute,
            path: '/custom-minimal-view',
            serverURL,
          }),
        )
        const pattern = new RegExp(`^${customRootViewMetaTitle}`)
        await expect(page.title()).resolves.toMatch(pattern)
      })
    })

    describe('robots', () => {
      test('should apply default robots meta tag', async () => {
        await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          'content',
          /noindex, nofollow/,
        )
      })
    })

    describe('favicons', () => {
      test('should render custom favicons', async () => {
        await page.goto(postsUrl.admin)
        const favicons = page.locator('link[rel="icon"]')

        await expect(favicons).toHaveCount(2)
        await expect(favicons.nth(0)).toHaveAttribute(
          'href',
          /\/custom-favicon-dark(\.[a-z\d]+)?\.png/,
        )
        await expect(favicons.nth(1)).toHaveAttribute('media', '(prefers-color-scheme: dark)')
        await expect(favicons.nth(1)).toHaveAttribute(
          'href',
          /\/custom-favicon-light(\.[a-z\d]+)?\.png/,
        )
      })
    })

    describe('og meta', () => {
      test('should render custom og:title from root config', async () => {
        await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
          'content',
          /This is a custom OG title/,
        )
      })

      test('should render custom og:description from root config', async () => {
        await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
        await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
          'content',
          /This is a custom OG description/,
        )
      })

      test('should render custom og:title from collection config', async () => {
        await page.goto(postsUrl.collection(postsCollectionSlug))
        await page.locator('.collection-list .table a').first().click()

        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
          'content',
          /This is a custom OG title for posts/,
        )
      })

      test('should render custom og:description from collection config', async () => {
        await page.goto(postsUrl.collection(postsCollectionSlug))
        await page.locator('.collection-list .table a').first().click()

        await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
          'content',
          /This is a custom OG description for posts/,
        )
      })

      test('should render og:image with dynamic URL', async () => {
        await page.goto(postsUrl.admin)
        const encodedOGDescription = encodeURIComponent('This is a custom OG description')
        const encodedOGTitle = encodeURIComponent('This is a custom OG title')

        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
          'content',
          new RegExp(`/api/og\\?description=${encodedOGDescription}&title=${encodedOGTitle}`),
        )
      })

      test('should render twitter:image with dynamic URL', async () => {
        await page.goto(postsUrl.admin)

        const encodedOGDescription = encodeURIComponent('This is a custom OG description')
        const encodedOGTitle = encodeURIComponent('This is a custom OG title')

        await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
          'content',
          new RegExp(`/api/og\\?description=${encodedOGDescription}&title=${encodedOGTitle}`),
        )
      })
    })

    describe('document meta', () => {
      test('should render custom meta title from collection config', async () => {
        await page.goto(customViewsURL.list)
        const pattern = new RegExp(`^${customCollectionMetaTitle}`)
        await expect(page.title()).resolves.toMatch(pattern)
      })

      test('should render custom meta title from default edit view', async () => {
        await navigateToDoc(page, customViewsURL)
        const pattern = new RegExp(`^${customDefaultTabMetaTitle}`)
        await expect(page.title()).resolves.toMatch(pattern)
      })

      test('should render custom meta title from nested edit view', async () => {
        await navigateToDoc(page, customViewsURL)
        const versionsURL = `${page.url()}/versions`
        await page.goto(versionsURL)
        const pattern = new RegExp(`^${customVersionsTabMetaTitle}`)
        await expect(page.title()).resolves.toMatch(pattern)
      })

      test('should render custom meta title from nested custom view', async () => {
        await navigateToDoc(page, customViewsURL)
        const customTabURL = `${page.url()}/custom-tab-view`
        await page.goto(customTabURL)
        const pattern = new RegExp(`^${customViewMetaTitle}`)
        await expect(page.title()).resolves.toMatch(pattern)
      })

      test('should render fallback meta title from nested custom view', async () => {
        await navigateToDoc(page, customViewsURL)
        const customTabURL = `${page.url()}${customTabViewPath}`
        await page.goto(customTabURL)
        const pattern = new RegExp(`^${customCollectionMetaTitle}`)
        await expect(page.title()).resolves.toMatch(pattern)
      })
    })
  })

  describe('theme', () => {
    test('should render light theme by default', async () => {
      await page.goto(postsUrl.admin)
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      await page.goto(`${postsUrl.admin}/account`)
      await expect(page.locator('#field-theme-auto')).toBeChecked()
      await expect(page.locator('#field-theme-light')).not.toBeChecked()
      await expect(page.locator('#field-theme-dark')).not.toBeChecked()
    })

    test('should explicitly change to light theme', async () => {
      await page.goto(`${postsUrl.admin}/account`)
      await page.locator('label[for="field-theme-light"]').click()
      await expect(page.locator('#field-theme-auto')).not.toBeChecked()
      await expect(page.locator('#field-theme-light')).toBeChecked()
      await expect(page.locator('#field-theme-dark')).not.toBeChecked()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

      // reload the page an ensure theme is retained
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

      // go back to auto theme
      await page.goto(`${postsUrl.admin}/account`)
      await page.locator('label[for="field-theme-auto"]').click()
      await expect(page.locator('#field-theme-auto')).toBeChecked()
      await expect(page.locator('#field-theme-light')).not.toBeChecked()
      await expect(page.locator('#field-theme-dark')).not.toBeChecked()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    })

    test('should explicitly change to dark theme', async () => {
      await page.goto(`${postsUrl.admin}/account`)
      await page.locator('label[for="field-theme-dark"]').click()
      await expect(page.locator('#field-theme-auto')).not.toBeChecked()
      await expect(page.locator('#field-theme-light')).not.toBeChecked()
      await expect(page.locator('#field-theme-dark')).toBeChecked()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

      // reload the page an ensure theme is retained
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

      // go back to auto theme
      await page.goto(`${postsUrl.admin}/account`)
      await page.locator('label[for="field-theme-auto"]').click()
      await expect(page.locator('#field-theme-auto')).toBeChecked()
      await expect(page.locator('#field-theme-light')).not.toBeChecked()
      await expect(page.locator('#field-theme-dark')).not.toBeChecked()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    })
  })

  describe('routing', () => {
    test('should 404 not found root pages', async () => {
      const unknownPageURL = formatAdminURL({
        adminRoute,
        path: '/1234',
        serverURL,
      })
      const response = await page.goto(unknownPageURL)
      expect(response.status() === 404).toBeTruthy()
      await expect(page.locator('.not-found')).toContainText('Nothing found')
    })

    test('should use custom logout route', async () => {
      const customLogoutRouteURL = formatAdminURL({
        adminRoute,
        path: adminRoutes.admin.routes.logout,
        serverURL,
      })
      const response = await page.goto(customLogoutRouteURL)
      expect(response.status() !== 404).toBeTruthy()
    })

    test('should redirect from non-existent document ID to collection list', async () => {
      const nonExistentDocURL = formatAdminURL({
        adminRoute,
        path: `/collections/${postsCollectionSlug}/999999`,
        serverURL,
      })
      await page.goto(nonExistentDocURL)
      // Should redirect to collection list with notFound query parameter
      await expect
        .poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT })
        .toMatch(
          formatAdminURL({
            adminRoute,
            path: `/collections/${postsCollectionSlug}?notFound=999999`,
            serverURL,
          }),
        )

      // Should show warning banner about document not found
      await expect(page.locator('.banner--type-error')).toBeVisible()
      await expect(page.locator('.banner--type-error')).toContainText('999999')
    })

    test('should not redirect `${adminRoute}/collections` to `${adminRoute} if there is a custom view', async () => {
      const collectionsURL = formatAdminURL({
        adminRoute,
        path: '/collections',
        serverURL,
      })
      await page.goto(collectionsURL)
      await expect(page.getByText('Custom View').first()).toBeVisible()
    })

    test('should redirect `${adminRoute}/globals` to `${adminRoute}', async () => {
      const globalsURL = formatAdminURL({
        adminRoute,
        path: '/globals',
        serverURL,
      })
      await page.goto(globalsURL)
      // Should redirect to dashboard
      await expect.poll(() => page.url()).toBe(formatAdminURL({ adminRoute, path: '', serverURL }))
    })

    /**
     * This test is skipped because `page.goBack()` and `page.goForward()` do not trigger navigation in the Next.js app.
     * I also tried rendering buttons that call `router.back()` and click those instead, but that also does not work.
     */
    test.skip("should clear the router's bfcache when navigating via the forward/back browser controls", async () => {
      const { id } = await createPost({
        title: 'Post to test bfcache',
      })

      // check for it in the list view first
      await page.goto(postsUrl.list)
      const cell = page.locator('.table td').filter({ hasText: 'Post to test bfcache' })
      await page.locator('.table a').filter({ hasText: id }).click()

      await page.waitForURL(`${postsUrl.edit(id)}`)
      const titleField = page.locator('#field-title')
      await expect(titleField).toHaveValue('Post to test bfcache')

      // change the title to something else
      await titleField.fill('Post to test bfcache - updated')
      await saveDocAndAssert(page)

      // now use the browser controls to go back to the list
      await page.goBack()
      await page.waitForURL(postsUrl.list)
      await expect(cell).toBeVisible()

      // and then forward to the edit page again
      await page.goForward()
      await page.waitForURL(`${postsUrl.edit(id)}`)
      await expect(titleField).toHaveValue('Post to test bfcache - updated')
    })
  })

  describe('navigation', () => {
    test('nav — should navigate to collection', async () => {
      await page.goto(postsUrl.admin)
      await openNav(page)
      const anchor = page.locator(`#nav-${postsCollectionSlug}`)
      const anchorHref = await anchor.getAttribute('href')
      await anchor.click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain(anchorHref)
    })

    test('nav — should navigate to a global', async () => {
      await page.goto(postsUrl.admin)
      await openNav(page)
      const anchor = page.locator(`#nav-global-${globalSlug}`)
      const anchorHref = await anchor.getAttribute('href')
      await anchor.click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain(anchorHref)
    })

    test('dashboard — should navigate to collection', async () => {
      await page.goto(postsUrl.admin)
      // Wait for hydration - otherwise playwright clicks the card early and nothing happens
      await wait(1000)
      const anchor = page.locator(`.card-${postsCollectionSlug} a.card__click`)
      const anchorHref = await anchor.getAttribute('href')
      await anchor.click()
      // flaky
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(1000)
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain(anchorHref)
    })

    test('nav — should collapse and expand collection groups', async () => {
      await page.goto(postsUrl.admin)
      await openNav(page)
      const navGroup = page.locator('#nav-group-One .nav-group__toggle')
      await expect(navGroup).toContainText('One')
      const button = page.locator('#nav-group-one-collection-ones')
      await expect(button).toBeVisible()
      await navGroup.click()
      await expect(button).toBeHidden()
      await navGroup.click()
      await expect(button).toBeVisible()
    })

    test('nav — should collapse and expand globals groups', async () => {
      await page.goto(postsUrl.admin)
      await openNav(page)
      const navGroup = page.locator('#nav-group-Group .nav-group__toggle')
      await expect(navGroup).toContainText('Group')
      const button = page.locator('#nav-global-group-globals-one')
      await expect(button).toBeVisible()
      await navGroup.click()
      await expect(button).toBeHidden()
      await navGroup.click()
      await expect(button).toBeVisible()
    })

    test('nav — should save group collapse preferences', async () => {
      await page.goto(postsUrl.admin)
      await openNav(page)
      await page.locator('#nav-group-One .nav-group__toggle').click()
      const link = page.locator('#nav-group-one-collection-ones')
      await expect(link).toBeHidden()
    })

    test('should disable active nav item', async () => {
      await page.goto(postsUrl.list)
      await openNav(page)
      const activeItem = page.locator('.nav .nav__link:has(.nav__link-indicator)')
      await expect(activeItem).toBeVisible()
      const tagName = await activeItem.evaluate((el) => el.tagName.toLowerCase())
      expect(tagName).toBe('div')
    })

    test('should keep active nav item enabled in the edit view', async () => {
      await page.goto(postsUrl.create)
      await openNav(page)
      const activeItem = page.locator('.nav .nav__link:has(.nav__link-indicator)')
      await expect(activeItem).toBeVisible()
      const tagName = await activeItem.evaluate((el) => el.tagName.toLowerCase())
      expect(tagName).toBe('a')
    })

    test('should only have one nav item active at a time', async () => {
      await page.goto(uploadsTwo.list)
      await openNav(page)

      // Locate "uploads" and "uploads-two" nav items
      const uploadsNavItem = page.locator('.nav-group__content #nav-uploads')
      const uploadsTwoNavItem = page.locator('.nav-group__content #nav-uploads-two')

      // Ensure both exist before continuing
      await expect(uploadsNavItem).toBeVisible()
      await expect(uploadsTwoNavItem).toBeVisible()

      // Locate all nav items containing the nav__link-indicator
      const activeNavItems = page.locator(
        '.nav-group__content .nav__link:has(.nav__link-indicator), .nav-group__content div.nav__link:has(.nav__link-indicator)',
      )

      // Expect exactly one nav item to have the indicator
      await expect(activeNavItems).toHaveCount(1)
    })

    test('settings menu — should show gear icon when settingsMenu is configured', async () => {
      await page.goto(postsUrl.admin)
      await openNav(page)
      const gearIcon = page.locator('.nav__controls .popup#settings-menu .gear')
      await expect(gearIcon).toBeVisible()
    })

    test('settings menu — should open popup when gear icon is clicked', async () => {
      await page.goto(postsUrl.admin)
      await openNav(page)
      const gearButton = page.locator('.nav__controls .popup#settings-menu .popup-button')
      await gearButton.click()
      const popupContent = page.locator('.popup__content')
      await expect(popupContent).toBeVisible()
    })

    test('settings menu — should render custom settingsMenu components', async () => {
      await page.goto(postsUrl.admin)
      await openNav(page)
      const gearButton = page.locator('.nav__controls .popup#settings-menu .popup-button')
      await gearButton.click()

      const popupButtons = page.locator(
        '[data-popup-id="settings-menu"] .popup-button-list__button',
      )

      // Check for the first group of buttons
      await expect(popupButtons.first()).toContainText('System Settings')
      await expect(popupButtons.nth(1)).toContainText('View Logs')

      // Check for the second group of buttons
      await expect(popupButtons.nth(2)).toContainText('Manage Users')
      await expect(popupButtons.nth(3)).toContainText('View Activity')
    })

    test('breadcrumbs — should navigate from list to dashboard', async () => {
      await page.goto(postsUrl.list)
      await page
        .locator(
          `.step-nav a[href="${formatAdminURL({ adminRoute, includeBasePath: true, path: '' })}"]`,
        )
        .click()
      expect(page.url()).toContain(postsUrl.admin)
    })

    test('breadcrumbs — should navigate from document to collection', async () => {
      const { id } = await createPost()
      await page.goto(postsUrl.edit(id))
      const collectionBreadcrumb = page.locator(
        `.step-nav a[href="${formatAdminURL({ adminRoute, includeBasePath: true, path: `/collections/${postsCollectionSlug}` })}"]`,
      )
      await expect(collectionBreadcrumb).toBeVisible()
      await expect(collectionBreadcrumb).toHaveText(slugPluralLabel)
      expect(page.url()).toContain(postsUrl.list)
    })

    test('should replace history when adding query params to the URL and not push a new entry', async () => {
      await page.goto(postsUrl.admin)
      // Wait for hydration - otherwise playwright clicks the card early and nothing happens
      await wait(1000)
      await page.locator('.collections__card-list .card__click').first().click()
      // flaky
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(1000)
      // wait for the search params to get injected into the URL
      const escapedAdminURL = postsUrl.admin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`${escapedAdminURL}/collections/[^?]+\\?limit=[^&]+`)
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toMatch(pattern)
      await page.goBack()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toMatch(postsUrl.admin)
    })
  })

  describe('hidden entities', () => {
    test('nav — should not show hidden collections and globals', async () => {
      await page.goto(postsUrl.admin)
      await expect(page.locator('#nav-hidden-collection')).toBeHidden()
      await expect(page.locator('#nav-hidden-global')).toBeHidden()
    })

    test('dashboard — should not show hidden collections and globals', async () => {
      await page.goto(postsUrl.admin)
      await expect(page.locator('#card-hidden-collection')).toBeHidden()
      await expect(page.locator('#card-hidden-global')).toBeHidden()
    })

    test('routing — should 404 on hidden collections and globals', async () => {
      await page.goto(postsUrl.collection('hidden-collection'))
      await expect(page.locator('.not-found')).toContainText('Nothing found')
      await page.goto(postsUrl.global('hidden-global'))
      await expect(page.locator('.not-found')).toContainText('Nothing found')
    })

    test('nav — should not show group: false collections and globals', async () => {
      await page.goto(notInViewUrl.admin)
      await expect(page.locator('#nav-not-in-view-collection')).toBeHidden()
      await expect(page.locator('#nav-global-not-in-view-global')).toBeHidden()
    })

    test('dashboard — should not show group: false collections and globals', async () => {
      await page.goto(notInViewUrl.admin)
      await expect(page.locator('#card-not-in-view-collection')).toBeHidden()
      await expect(page.locator('#card-not-in-view-global')).toBeHidden()
    })

    test('routing — should not 404 on group: false collections and globals', async () => {
      await page.goto(notInViewUrl.collection('not-in-view-collection'))
      await expect(page.locator('.list-header h1')).toContainText('Not In View Collections')
      await page.goto(notInViewUrl.global('not-in-view-global'))
      await expect(page.locator('.render-title')).toContainText('Not In View Global')
    })

    test('should hide Copy To Locale button when disableCopyToLocale: true', async () => {
      await page.goto(disableCopyToLocale.create)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await page.locator('.doc-controls__popup >> .popup-button').click()
      await expect(page.locator('#copy-locale-data__button')).toBeHidden()
    })
  })

  describe('custom CSS', () => {
    test('should see custom css in admin UI', async () => {
      await page.goto(postsUrl.admin)
      await openNav(page)
      const navControls = page.locator('#custom-css')
      await expect(navControls).toHaveCSS('font-family', 'monospace')
    })
  })

  describe('custom providers', () => {
    test('should render custom providers', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
      await expect(page.locator('.custom-provider')).toHaveCount(1)
      await expect(page.locator('.custom-provider')).toContainText('This is a custom provider.')
    })

    test('should render custom provider server components with props', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
      await expect(page.locator('.custom-provider-server')).toHaveCount(1)
      await expect(page.locator('.custom-provider-server')).toContainText(
        'This is a custom provider with payload: true',
      )
    })
  })

  describe('custom root views', () => {
    test('should render custom view', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: customViewPath, serverURL }))
      await expect(page.locator('h1#custom-view-title')).toContainText(customViewTitle)
    })

    test('should render custom nested view', async () => {
      await page.goto(
        formatAdminURL({
          adminRoute,
          path: customNestedViewPath,
          serverURL,
        }),
      )
      const pageURL = page.url()
      const pathname = new URL(pageURL).pathname
      expect(pathname).toEqual(`${adminRoutes.routes.admin}${customNestedViewPath}`)
      await expect(page.locator('h1#custom-view-title')).toContainText(customNestedViewTitle)
    })

    test('should render public custom view', async () => {
      await page.goto(
        formatAdminURL({
          adminRoute,
          path: publicCustomViewPath,
          serverURL,
        }),
      )
      await expect(page.locator('h1#custom-view-title')).toContainText(customViewTitle)
    })

    test('should render protected nested custom view', async () => {
      await page.goto(
        formatAdminURL({
          adminRoute,
          path: protectedCustomNestedViewPath,
          serverURL,
        }),
      )

      // wait for redirect to unauthorized page
      await page.waitForURL(`**${adminRoutes.routes.admin}/unauthorized`)
      await expect(page.locator('.unauthorized')).toBeVisible()

      await page.goto(globalURL.global(settingsGlobalSlug))

      const checkbox = page.locator('#field-canAccessProtected')

      await checkbox.check()

      await saveDocAndAssert(page)

      await page.goto(
        formatAdminURL({
          adminRoute,
          path: protectedCustomNestedViewPath,
          serverURL,
        }),
      )
      await expect(page.locator('h1#custom-view-title')).toContainText(customNestedViewTitle)
    })
  })

  describe('header actions', () => {
    test('should show admin level action in admin panel', async () => {
      await page.goto(postsUrl.admin)
      // Check if the element with the class .admin-button exists
      await expect(page.locator('.app-header .admin-button')).toHaveCount(1)
    })

    test('should show admin level action in collection list view', async () => {
      await page.goto(new AdminUrlUtil(serverURL, 'geo').list)
      await expect(page.locator('.app-header .admin-button')).toHaveCount(1)
    })

    test('should show admin level action in collection edit view', async () => {
      const { id } = await createGeo()
      await page.goto(geoUrl.edit(id))
      await expect(page.locator('.app-header .admin-button')).toHaveCount(1)
    })

    test('should show collection list view level action in collection list view', async () => {
      await page.goto(new AdminUrlUtil(serverURL, 'geo').list)
      await expect(page.locator('.app-header .collection-list-button')).toHaveCount(1)
    })

    test('should show collection edit view level action in collection edit view', async () => {
      const { id } = await createGeo()
      await page.goto(geoUrl.edit(id))
      await expect(page.locator('.app-header .collection-edit-button')).toHaveCount(1)
    })

    test('should show collection api view level action in collection api view', async () => {
      const { id } = await createGeo()
      await page.goto(`${geoUrl.edit(id)}/api`)
      await expect(page.locator('.app-header .collection-api-button')).toHaveCount(1)
    })

    test('should show global edit view level action in globals edit view', async () => {
      const globalWithPreview = new AdminUrlUtil(serverURL, globalSlug)
      await page.goto(globalWithPreview.global(globalSlug))
      await expect(page.locator('.app-header .global-edit-button')).toHaveCount(1)
    })

    test('should show global api view level action in globals api view', async () => {
      const globalWithPreview = new AdminUrlUtil(serverURL, globalSlug)
      await page.goto(`${globalWithPreview.global(globalSlug)}/api`)
      await expect(page.locator('.app-header .global-api-button')).toHaveCount(1)
    })

    test('should reset actions array when navigating from view with actions to view without actions', async () => {
      await page.goto(geoUrl.list)
      await expect(page.locator('.app-header .collection-list-button')).toHaveCount(1)
      await page.locator('button.nav-toggler[aria-label="Open Menu"][tabindex="0"]').click()
      await page.locator(`#nav-posts`).click()
      await expect(page.locator('.app-header .collection-list-button')).toHaveCount(0)
    })
  })

  describe('custom components', () => {
    test('should render custom header', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
      const header = page.locator('.custom-header')
      await expect(header).toContainText('Here is a custom header')
    })
  })

  describe('i18n', () => {
    test('should allow changing language', async () => {
      await page.goto(postsUrl.account)

      const field = page.locator('.payload-settings__language .react-select')

      await field.click()
      const options = page.locator('.rs__option')
      await options.locator('text=Español').click()

      await expect(page.locator('.step-nav a').first().locator('span')).toHaveAttribute(
        'title',
        'Panel de Control',
      )

      await field.click()
      await options.locator('text=English').click()
      await field.click()
      await expect(page.locator('.form-submit .btn')).toContainText('Save')
    })

    test('should allow custom translation', async () => {
      await page.goto(postsUrl.account)
      await expect(page.locator('.step-nav a').first().locator('span')).toHaveAttribute(
        'title',
        'Home',
      )
    })

    test('should allow custom translation of locale labels', async () => {
      await page.goto(postsUrl.account)
      // Wait for hydration - otherwise playwright clicks the localizer early and nothing happens
      await wait(1000)

      const selectOptionClass = '.popup__content .popup-button-list__button'
      const localizerButton = page.locator('.localizer .popup-button')
      const localeListItem1 = page.locator(selectOptionClass).nth(0)

      async function checkLocaleLabels(firstLabel: string, secondLabel: string) {
        await localizerButton.click()
        await expect(page.locator(selectOptionClass).first()).toContainText(firstLabel)
        await expect(page.locator(selectOptionClass).nth(1)).toContainText(secondLabel)
      }

      await checkLocaleLabels('Spanish (es)', 'English (en)')

      // Change locale to Spanish
      await expect(localeListItem1).toContainText('Spanish (es)')
      await localeListItem1.click()

      // Go to account page
      await page.goto(postsUrl.account)

      const languageField = page.locator('.payload-settings__language .react-select')
      const options = page.locator('.rs__option')

      // Change language to Spanish
      await languageField.click()
      await options.locator('text=Español').click()

      await checkLocaleLabels('Español (es)', 'Inglés (en)')

      // Change locale and language back to English
      await languageField.click()
      await options.locator('text=English').click()
      await localizerButton.click()
      await expect(localeListItem1).toContainText('Spanish (es)')
    })
  })

  describe('CRUD', () => {
    test('should create', async () => {
      await page.goto(postsUrl.create)
      await page.locator('#field-title').fill(title)
      await page.locator('#field-description').fill(description)
      await saveDocAndAssert(page)
      await expect(page.locator('#field-title')).toHaveValue(title)
      await expect(page.locator('#field-description')).toHaveValue(description)
    })

    test('should read existing', async () => {
      const { id } = await createPost()
      await page.goto(postsUrl.edit(id))
      await expect(page.locator('#field-title')).toHaveValue(title)
      await expect(page.locator('#field-description')).toHaveValue(description)
    })

    test('should update existing', async () => {
      const { id } = await createPost()
      await page.goto(postsUrl.edit(id))
      const newTitle = 'new title'
      const newDesc = 'new description'
      await page.locator('#field-title').fill(newTitle)
      await page.locator('#field-description').fill(newDesc)
      await saveDocAndAssert(page)
      await expect(page.locator('#field-title')).toHaveValue(newTitle)
      await expect(page.locator('#field-description')).toHaveValue(newDesc)
    })

    test('should save using hotkey', async () => {
      const { id } = await createPost()
      await page.goto(postsUrl.edit(id))
      const newTitle = 'new title'
      await page.locator('#field-title').fill(newTitle)
      await saveDocHotkeyAndAssert(page)
      await expect(page.locator('#field-title')).toHaveValue(newTitle)
    })

    test('should delete existing', async () => {
      const { id, title } = await createPost()
      await page.goto(postsUrl.edit(id))
      await openDocControls(page)
      await page.locator('#action-delete').click()
      await page.locator(`[id=delete-${id}] #confirm-action`).click()
      await expect(page.locator(`text=Post "${title}" successfully deleted.`)).toBeVisible()
      expect(page.url()).toContain(postsUrl.list)
    })

    test('should save globals', async () => {
      await page.goto(postsUrl.global(globalSlug))

      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)

      await expect(page.locator('#field-title')).toHaveValue(title)
    })

    test('should hide duplicate when disableDuplicate: true', async () => {
      await page.goto(disableDuplicateURL.create)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await page.locator('.doc-controls__popup >> .popup-button').click()
      await expect(page.locator('#action-duplicate')).toBeHidden()
    })

    test('should properly close leave-without-saving modal after clicking leave-anyway button', async () => {
      const { id } = await createPost()
      await page.goto(postsUrl.edit(id))
      const title = 'title'
      await page.locator('#field-title').fill(title)
      await saveDocHotkeyAndAssert(page)
      await expect(page.locator('#field-title')).toHaveValue(title)

      const newTitle = 'new title'
      await page.locator('#field-title').fill(newTitle)

      await page.locator(`header.app-header a[href="/admin/collections/posts"]`).click()

      // Locate the modal container
      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      // Click the "Leave anyway" button
      await page
        .locator('#leave-without-saving .confirmation-modal__controls .btn--style-primary')
        .click()

      // Assert that the class on the modal container changes to 'payload__modal-container--exitDone'
      await expect(modalContainer).toHaveClass(/payload__modal-container--exitDone/)
    })
  })

  test('should not open leave-without-saving modal if opening a new tab', async () => {
    const title = 'title'
    await page.goto(postsUrl.create)
    await page.locator('#field-title').fill(title)
    await expect(page.locator('#field-title')).toHaveValue(title)

    const newTitle = 'new title'
    await page.locator('#field-title').fill(newTitle)

    // Open link in a new tab by holding down the Meta or Control key
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page
        .locator(`header.app-header a[href="/admin/collections/posts"]`)
        .click({ modifiers: ['ControlOrMeta'] }),
    ])

    // Wait for navigation to complete in the new tab and ensure correct URL
    await expect(newPage.locator('.list-header')).toBeVisible()
    // using contain here, because after load the lists view will add query params like "?limit=10"
    expect(newPage.url()).toContain(postsUrl.list)

    // Locate the modal container and ensure it is not visible
    const modalContainer = page.locator('.payload__modal-container')
    await expect(modalContainer).toBeHidden()

    // Ensure the original page is the correct URL
    expect(page.url()).toBe(postsUrl.create)
  })

  describe('preferences', () => {
    test('should successfully reset prefs after clicking reset button', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/account', serverURL }))
      const resetPrefsButton = page.locator('.payload-settings > div > button.btn')
      await expect(resetPrefsButton).toBeVisible()
      await resetPrefsButton.click()
      const confirmModal = page.locator('dialog#confirm-reset-modal')
      await expect(confirmModal).toBeVisible()
      const confirmButton = confirmModal.locator('button.btn--style-primary')
      await expect(confirmButton).toContainText('Confirm')
      await confirmButton.click()
      const toast = page.locator('li.payload-toast-item.toast-success')
      await expect(toast).toBeVisible()
    })
  })

  describe('progress bar', () => {
    test('should show progress bar on page navigation', async () => {
      // eslint-disable-next-line playwright/no-networkidle
      await page.goto(postsUrl.admin, { waitUntil: 'networkidle' })
      // Wait for hydration - otherwise playwright clicks the card early and nothing happens
      await wait(1000)

      // Throttle network to ensure navigation takes > 500ms so progress bar is visible
      // Progress bar has 150ms initial delay before showing, so fast navigations won't show it
      const client = await page.context().newCDPSession(page)
      await client.send('Network.emulateNetworkConditions', {
        downloadThroughput: (500 * 1024) / 8, // 500 kbps
        latency: 400, // 400ms latency
        offline: false,
        uploadThroughput: (500 * 1024) / 8,
      })

      await page.locator('.collections__card-list .card').first().click()
      await expect(page.locator('.progress-bar')).toBeVisible()

      // Reset network conditions
      await client.send('Network.emulateNetworkConditions', {
        downloadThroughput: -1,
        latency: 0,
        offline: false,
        uploadThroughput: -1,
      })
    })
  })
})

async function createPost(overrides?: Partial<Post>): Promise<Post> {
  return payload.create({
    collection: postsCollectionSlug,
    data: {
      description,
      title,
      ...overrides,
    },
  }) as unknown as Promise<Post>
}

async function createGeo(overrides?: Partial<Geo>): Promise<Geo> {
  return payload.create({
    collection: geoCollectionSlug,
    data: {
      point: [4, -4],
      ...overrides,
    },
  }) as unknown as Promise<Geo>
}
