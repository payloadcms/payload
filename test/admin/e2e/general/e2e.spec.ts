import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type { Config, Geo, Post } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  getRoutes,
  initPageConsoleErrorCatch,
  openNav,
  saveDocAndAssert,
  saveDocHotkeyAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import {
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
  disableDuplicateSlug,
  geoCollectionSlug,
  globalSlug,
  notInViewCollectionSlug,
  postsCollectionSlug,
  settingsGlobalSlug,
} from '../../slugs.js'

const { beforeAll, beforeEach, describe } = test

const title = 'Title'
const description = 'Description'

let payload: PayloadTestSDK<Config>

import { navigateToDoc } from 'helpers/e2e/navigateToDoc.js'
import { openDocControls } from 'helpers/e2e/openDocControls.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'

import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

describe('General', () => {
  let page: Page
  let postsUrl: AdminUrlUtil
  let geoUrl: AdminUrlUtil
  let notInViewUrl: AdminUrlUtil
  let globalURL: AdminUrlUtil
  let customViewsURL: AdminUrlUtil
  let disableDuplicateURL: AdminUrlUtil
  let serverURL: string
  let adminRoutes: ReturnType<typeof getRoutes>

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
    disableDuplicateURL = new AdminUrlUtil(serverURL, disableDuplicateSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })

    adminRoutes = getRoutes({ customAdminRoutes })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'adminTests',
    })

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })
  })

  describe('metadata', () => {
    describe('root title and description', () => {
      test('should render custom page title suffix', async () => {
        await page.goto(`${serverURL}/admin`)
        await expect(page.title()).resolves.toMatch(/- Custom Title Suffix$/)
      })

      test('should render custom meta description from root config', async () => {
        await page.goto(`${serverURL}/admin`)
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
        await page.goto(`${serverURL}/admin/custom-default-view`)
        await expect(page.title()).resolves.toMatch(/- Custom Title Suffix$/)
      })

      test('should render custom meta title from custom root views', async () => {
        await page.goto(`${serverURL}/admin/custom-minimal-view`)
        const pattern = new RegExp(`^${customRootViewMetaTitle}`)
        await expect(page.title()).resolves.toMatch(pattern)
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
        await page.goto(`${serverURL}/admin`)
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
          'content',
          /This is a custom OG title/,
        )
      })

      test('should render custom og:description from root config', async () => {
        await page.goto(`${serverURL}/admin`)
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
        await page.waitForURL(customViewsURL.list)
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
        await page.waitForURL(versionsURL)
        const pattern = new RegExp(`^${customVersionsTabMetaTitle}`)
        await expect(page.title()).resolves.toMatch(pattern)
      })

      test('should render custom meta title from nested custom view', async () => {
        await navigateToDoc(page, customViewsURL)
        const customTabURL = `${page.url()}/custom-tab-view`
        await page.goto(customTabURL)
        await page.waitForURL(customTabURL)
        const pattern = new RegExp(`^${customViewMetaTitle}`)
        await expect(page.title()).resolves.toMatch(pattern)
      })

      test('should render fallback meta title from nested custom view', async () => {
        await navigateToDoc(page, customViewsURL)
        const customTabURL = `${page.url()}${customTabViewPath}`
        await page.goto(customTabURL)
        await page.waitForURL(customTabURL)
        const pattern = new RegExp(`^${customCollectionMetaTitle}`)
        await expect(page.title()).resolves.toMatch(pattern)
      })
    })
  })

  describe('theme', () => {
    test('should render light theme by default', async () => {
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
      await page.goto(`${postsUrl.admin}/account`)
      await page.waitForURL(`${postsUrl.admin}/account`)
      await expect(page.locator('#field-theme-auto')).toBeChecked()
      await expect(page.locator('#field-theme-light')).not.toBeChecked()
      await expect(page.locator('#field-theme-dark')).not.toBeChecked()
    })

    test('should explicitly change to light theme', async () => {
      await page.goto(`${postsUrl.admin}/account`)
      await page.waitForURL(`${postsUrl.admin}/account`)
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
      await page.waitForURL(`${postsUrl.admin}/account`)
      await page.locator('label[for="field-theme-auto"]').click()
      await expect(page.locator('#field-theme-auto')).toBeChecked()
      await expect(page.locator('#field-theme-light')).not.toBeChecked()
      await expect(page.locator('#field-theme-dark')).not.toBeChecked()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    })

    test('should explicitly change to dark theme', async () => {
      await page.goto(`${postsUrl.admin}/account`)
      await page.waitForURL(`${postsUrl.admin}/account`)
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
      await page.waitForURL(`${postsUrl.admin}/account`)
      await page.locator('label[for="field-theme-auto"]').click()
      await expect(page.locator('#field-theme-auto')).toBeChecked()
      await expect(page.locator('#field-theme-light')).not.toBeChecked()
      await expect(page.locator('#field-theme-dark')).not.toBeChecked()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    })
  })

  describe('routing', () => {
    test('should 404 not found root pages', async () => {
      const unknownPageURL = `${serverURL}/admin/1234`
      const response = await page.goto(unknownPageURL)
      expect(response.status() === 404).toBeTruthy()
      await expect(page.locator('.not-found')).toContainText('Nothing found')
    })

    test('should 404 not found documents', async () => {
      const unknownDocumentURL = `${postsUrl.collection(postsCollectionSlug)}/1234`
      const response = await page.goto(unknownDocumentURL)
      expect(response.status() === 404).toBeTruthy()
      await expect(page.locator('.not-found')).toContainText('Nothing found')
    })

    test('should use custom logout route', async () => {
      const customLogoutRouteURL = `${serverURL}${adminRoutes.routes.admin}${adminRoutes.admin.routes.logout}`
      const response = await page.goto(customLogoutRouteURL)
      expect(response.status() !== 404).toBeTruthy()
    })
  })

  describe('navigation', () => {
    test('nav — should navigate to collection', async () => {
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)
      await openNav(page)
      const anchor = page.locator(`#nav-${postsCollectionSlug}`)
      const anchorHref = await anchor.getAttribute('href')
      await anchor.click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain(anchorHref)
    })

    test('nav — should navigate to a global', async () => {
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)
      await openNav(page)
      const anchor = page.locator(`#nav-global-${globalSlug}`)
      const anchorHref = await anchor.getAttribute('href')
      await anchor.click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain(anchorHref)
    })

    test('dashboard — should navigate to collection', async () => {
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)
      const anchor = page.locator(`#card-${postsCollectionSlug} a.card__click`)
      const anchorHref = await anchor.getAttribute('href')
      await anchor.click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain(anchorHref)
    })

    test('nav — should collapse and expand collection groups', async () => {
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)
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
      await page.waitForURL(postsUrl.admin)
      await openNav(page)
      await page.locator('#nav-group-One .nav-group__toggle').click()
      const link = page.locator('#nav-group-one-collection-ones')
      await expect(link).toBeHidden()
    })

    test('breadcrumbs — should navigate from list to dashboard', async () => {
      await page.goto(postsUrl.list)
      await page.locator(`.step-nav a[href="${adminRoutes.routes.admin}"]`).click()
      expect(page.url()).toContain(postsUrl.admin)
    })

    test('breadcrumbs — should navigate from document to collection', async () => {
      const { id } = await createPost()
      await page.goto(postsUrl.edit(id))
      const collectionBreadcrumb = page.locator(
        `.step-nav a[href="${adminRoutes.routes.admin}/collections/${postsCollectionSlug}"]`,
      )
      await expect(collectionBreadcrumb).toBeVisible()
      await expect(collectionBreadcrumb).toHaveText(slugPluralLabel)
      expect(page.url()).toContain(postsUrl.list)
    })
  })

  describe('hidden entities', () => {
    test('nav — should not show hidden collections and globals', async () => {
      await page.goto(postsUrl.admin)
      // nav menu
      await expect(page.locator('#nav-hidden-collection')).toBeHidden()
      await expect(page.locator('#nav-hidden-global')).toBeHidden()
    })

    test('dashboard — should not show hidden collections and globals', async () => {
      await page.goto(postsUrl.admin)
      // dashboard
      await expect(page.locator('#card-hidden-collection')).toBeHidden()
      await expect(page.locator('#card-hidden-global')).toBeHidden()
    })

    test('routing — should 404 on hidden collections and globals', async () => {
      // routing
      await page.goto(postsUrl.collection('hidden-collection'))
      await expect(page.locator('.not-found')).toContainText('Nothing found')
      await page.goto(postsUrl.global('hidden-global'))
      await expect(page.locator('.not-found')).toContainText('Nothing found')
    })

    test('nav — should not show group: false collections and globals', async () => {
      await page.goto(notInViewUrl.admin)
      // nav menu
      await expect(page.locator('#nav-not-in-view-collection')).toBeHidden()
      await expect(page.locator('#nav-global-not-in-view-global')).toBeHidden()
    })

    test('dashboard — should not show group: false collections and globals', async () => {
      await page.goto(notInViewUrl.admin)
      // dashboard
      await expect(page.locator('#card-not-in-view-collection')).toBeHidden()
      await expect(page.locator('#card-not-in-view-global')).toBeHidden()
    })

    test('routing — should not 404 on group: false collections and globals', async () => {
      // routing
      await page.goto(notInViewUrl.collection('not-in-view-collection'))
      await expect(page.locator('.list-header h1')).toContainText('Not In View Collections')
      await page.goto(notInViewUrl.global('not-in-view-global'))
      await expect(page.locator('.render-title')).toContainText('Not In View Global')
    })
  })

  describe('custom CSS', () => {
    test('should see custom css in admin UI', async () => {
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)
      await openNav(page)
      const navControls = page.locator('#custom-css')
      await expect(navControls).toHaveCSS('font-family', 'monospace')
    })
  })

  describe('custom providers', () => {
    test('should render custom providers', async () => {
      await page.goto(`${serverURL}/admin`)
      await expect(page.locator('.custom-provider')).toHaveCount(1)
      await expect(page.locator('.custom-provider')).toContainText('This is a custom provider.')
    })

    test('should render custom provider server components with props', async () => {
      await page.goto(`${serverURL}/admin`)
      await expect(page.locator('.custom-provider-server')).toHaveCount(1)
      await expect(page.locator('.custom-provider-server')).toContainText(
        'This is a custom provider with payload: true',
      )
    })
  })

  describe('custom root views', () => {
    test('should render custom view', async () => {
      await page.goto(`${serverURL}${adminRoutes.routes.admin}${customViewPath}`)
      await page.waitForURL(`**${adminRoutes.routes.admin}${customViewPath}`)
      await expect(page.locator('h1#custom-view-title')).toContainText(customViewTitle)
    })

    test('should render custom nested view', async () => {
      await page.goto(`${serverURL}${adminRoutes.routes.admin}${customNestedViewPath}`)
      const pageURL = page.url()
      const pathname = new URL(pageURL).pathname
      expect(pathname).toEqual(`${adminRoutes.routes.admin}${customNestedViewPath}`)
      await expect(page.locator('h1#custom-view-title')).toContainText(customNestedViewTitle)
    })

    test('should render public custom view', async () => {
      await page.goto(`${serverURL}${adminRoutes.routes.admin}${publicCustomViewPath}`)
      await page.waitForURL(`**${adminRoutes.routes.admin}${publicCustomViewPath}`)
      await expect(page.locator('h1#custom-view-title')).toContainText(customViewTitle)
    })

    test('should render protected nested custom view', async () => {
      await page.goto(`${serverURL}${adminRoutes.routes.admin}${protectedCustomNestedViewPath}`)
      await page.waitForURL(`**${adminRoutes.routes.admin}/unauthorized`)
      await expect(page.locator('.unauthorized')).toBeVisible()

      await page.goto(globalURL.global(settingsGlobalSlug))

      const checkbox = page.locator('#field-canAccessProtected')

      await checkbox.check()

      await saveDocAndAssert(page)

      await page.goto(`${serverURL}${adminRoutes.routes.admin}${protectedCustomNestedViewPath}`)
      await page.waitForURL(`**${adminRoutes.routes.admin}${protectedCustomNestedViewPath}`)
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
      await page.goto(`${new AdminUrlUtil(serverURL, 'geo').list}`)
      await expect(page.locator('.app-header .admin-button')).toHaveCount(1)
    })

    test('should show admin level action in collection edit view', async () => {
      const { id } = await createGeo()
      await page.goto(geoUrl.edit(id))
      await expect(page.locator('.app-header .admin-button')).toHaveCount(1)
    })

    test('should show collection list view level action in collection list view', async () => {
      await page.goto(`${new AdminUrlUtil(serverURL, 'geo').list}`)
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
      await page.goto(`${serverURL}/admin`)
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
        'Tablero',
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
      const selectOptionClass = '.localizer .popup-button-list__button'
      const localizerButton = page.locator('.localizer .popup-button')
      const localeListItem1 = page.locator(selectOptionClass).nth(0)

      async function checkLocaleLabels(firstLabel: string, secondLabel: string) {
        await localizerButton.click()
        await expect(page.locator(selectOptionClass).first()).toContainText(firstLabel)
        await expect(page.locator(selectOptionClass).nth(1)).toContainText(secondLabel)
      }

      await checkLocaleLabels('Spanish (es)', 'English (en)')

      // Change locale to Spanish
      await localizerButton.click()
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
      await page.locator('#confirm-delete').click()
      await expect(page.locator(`text=Post "${title}" successfully deleted.`)).toBeVisible()
      expect(page.url()).toContain(postsUrl.list)
    })

    test('should bulk delete all on page', async () => {
      await deleteAllPosts()
      await Promise.all([createPost(), createPost(), createPost()])
      await page.goto(postsUrl.list)
      await page.locator('input#select-all').check()
      await page.locator('.delete-documents__toggle').click()
      await page.locator('#confirm-delete').click()

      await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
        'Deleted 3 Posts successfully.',
      )

      await expect(page.locator('.collection-list__no-results')).toBeVisible()
    })

    test('should bulk delete with filters and across pages', async () => {
      await deleteAllPosts()
      await Promise.all([createPost({ title: 'Post 1' }), createPost({ title: 'Post 2' })])
      await page.goto(postsUrl.list)
      await page.locator('#search-filter-input').fill('Post 1')
      await expect(page.locator('.table table > tbody > tr')).toHaveCount(1)
      await page.locator('input#select-all').check()
      await page.locator('button.list-selection__button').click()
      await page.locator('.delete-documents__toggle').click()
      await page.locator('#confirm-delete').click()

      await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
        'Deleted 1 Post successfully.',
      )

      await expect(page.locator('.table table > tbody > tr')).toHaveCount(1)
    })

    test('should bulk update', async () => {
      // First, delete all posts created by the seed
      await deleteAllPosts()
      const post1Title = 'Post'
      const updatedPostTitle = `${post1Title} (Updated)`
      await Promise.all([createPost({ title: post1Title }), createPost(), createPost()])
      await page.goto(postsUrl.list)
      await page.locator('input#select-all').check()
      await page.locator('.edit-many__toggle').click()
      await page.locator('.field-select .rs__control').click()

      const titleOption = page.locator('.field-select .rs__option', {
        hasText: exactText('Title'),
      })

      await expect(titleOption).toBeVisible()
      await titleOption.click()
      const titleInput = page.locator('#field-title')
      await expect(titleInput).toBeVisible()
      await titleInput.fill(updatedPostTitle)
      await page.locator('.form-submit button[type="submit"].edit-many__publish').click()

      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
        'Updated 3 Posts successfully.',
      )

      await expect(page.locator('.row-1 .cell-title')).toContainText(updatedPostTitle)
      await expect(page.locator('.row-2 .cell-title')).toContainText(updatedPostTitle)
      await expect(page.locator('.row-3 .cell-title')).toContainText(updatedPostTitle)
    })

    test('should not override un-edited values in bulk edit if it has a defaultValue', async () => {
      await deleteAllPosts()
      const post1Title = 'Post'
      const postData = {
        title: 'Post',
        arrayOfFields: [
          {
            optional: 'some optional array field',
            innerArrayOfFields: [
              {
                innerOptional: 'some inner optional array field',
              },
            ],
          },
        ],
        group: {
          defaultValueField: 'not the group default value',
          title: 'some title',
        },
        someBlock: [
          {
            textFieldForBlock: 'some text for block text',
            blockType: 'textBlock',
          },
        ],
        defaultValueField: 'not the default value',
      }
      const updatedPostTitle = `${post1Title} (Updated)`
      await createPost(postData)
      await page.goto(postsUrl.list)
      await page.locator('input#select-all').check()
      await page.locator('.edit-many__toggle').click()
      await page.locator('.field-select .rs__control').click()

      const titleOption = page.locator('.field-select .rs__option', {
        hasText: exactText('Title'),
      })

      await expect(titleOption).toBeVisible()
      await titleOption.click()
      const titleInput = page.locator('#field-title')
      await expect(titleInput).toBeVisible()
      await titleInput.fill(updatedPostTitle)
      await page.locator('.form-submit button[type="submit"].edit-many__publish').click()

      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
        'Updated 1 Post successfully.',
      )

      const updatedPost = await payload.find({
        collection: 'posts',
        limit: 1,
      })

      expect(updatedPost.docs[0].title).toBe(updatedPostTitle)
      expect(updatedPost.docs[0].arrayOfFields.length).toBe(1)
      expect(updatedPost.docs[0].arrayOfFields[0].optional).toBe('some optional array field')
      expect(updatedPost.docs[0].arrayOfFields[0].innerArrayOfFields.length).toBe(1)
      expect(updatedPost.docs[0].someBlock[0].textFieldForBlock).toBe('some text for block text')
      expect(updatedPost.docs[0].defaultValueField).toBe('not the default value')
    })

    test('should bulk update with filters and across pages', async () => {
      // First, delete all posts created by the seed
      await deleteAllPosts()
      const post1Title = 'Post 1'
      await Promise.all([createPost({ title: post1Title }), createPost({ title: 'Post 2' })])
      const updatedPostTitle = `${post1Title} (Updated)`
      await page.goto(postsUrl.list)
      await page.locator('#search-filter-input').fill('Post 1')
      await expect(page.locator('.table table > tbody > tr')).toHaveCount(1)
      await page.locator('input#select-all').check()
      await page.locator('button.list-selection__button').click()
      await page.locator('.edit-many__toggle').click()
      await page.locator('.field-select .rs__control').click()

      const titleOption = page.locator('.field-select .rs__option', {
        hasText: exactText('Title'),
      })

      await expect(titleOption).toBeVisible()
      await titleOption.click()
      const titleInput = page.locator('#field-title')
      await expect(titleInput).toBeVisible()
      await titleInput.fill(updatedPostTitle)

      await page.locator('.form-submit button[type="submit"].edit-many__publish').click()
      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
        'Updated 1 Post successfully.',
      )

      await expect(page.locator('.table table > tbody > tr')).toHaveCount(1)
      await expect(page.locator('.row-1 .cell-title')).toContainText(updatedPostTitle)
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

      await page.locator('header.app-header a[href="/admin/collections/posts"]').click()

      // Locate the modal container
      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      // Click the "Leave anyway" button
      await page.locator('.leave-without-saving__controls .btn--style-primary').click()

      // Assert that the class on the modal container changes to 'payload__modal-container--exitDone'
      await expect(modalContainer).toHaveClass(/payload__modal-container--exitDone/)
    })
  })

  describe('preferences', () => {
    test('should successfully reset prefs after clicking reset button', async () => {
      await page.goto(`${serverURL}/admin/account`)
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
})

async function deleteAllPosts() {
  await payload.delete({ collection: postsCollectionSlug, where: { id: { exists: true } } })
}

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
