import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { wait } from 'payload/shared'

import type { Config, Geo, Post } from '../../payload-types.js'

import {
  checkBreadcrumb,
  checkPageTitle,
  ensureCompilationIsDone,
  exactText,
  getRoutes,
  initPageConsoleErrorCatch,
  openDocControls,
  openNav,
  saveDocAndAssert,
  saveDocHotkeyAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import {
  customAdminRoutes,
  customEditLabel,
  customNestedTabViewPath,
  customNestedTabViewTitle,
  customNestedViewPath,
  customNestedViewTitle,
  customTabLabel,
  customTabViewPath,
  customTabViewTitle,
  customViewPath,
  customViewTitle,
  slugPluralLabel,
} from '../../shared.js'
import {
  customFieldsSlug,
  customGlobalViews2GlobalSlug,
  customIdCollectionId,
  customViews2CollectionSlug,
  disableDuplicateSlug,
  geoCollectionSlug,
  globalSlug,
  group1Collection1Slug,
  group1GlobalSlug,
  noApiViewCollectionSlug,
  noApiViewGlobalSlug,
  postsCollectionSlug,
} from '../../slugs.js'

const { beforeAll, beforeEach, describe } = test

const title = 'Title'
const description = 'Description'

let payload: PayloadTestSDK<Config>

import { navigateToDoc } from 'helpers/e2e/navigateToDoc.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'

import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

describe('admin1', () => {
  let page: Page
  let geoUrl: AdminUrlUtil
  let postsUrl: AdminUrlUtil
  let globalURL: AdminUrlUtil
  let customViewsURL: AdminUrlUtil
  let customFieldsURL: AdminUrlUtil
  let disableDuplicateURL: AdminUrlUtil
  let serverURL: string
  let adminRoutes: ReturnType<typeof getRoutes>
  let loginURL: string

  beforeAll(async ({ browser }, testInfo) => {
    const prebuild = Boolean(process.env.CI)

    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      prebuild,
    }))
    geoUrl = new AdminUrlUtil(serverURL, geoCollectionSlug)
    postsUrl = new AdminUrlUtil(serverURL, postsCollectionSlug)
    globalURL = new AdminUrlUtil(serverURL, globalSlug)
    customViewsURL = new AdminUrlUtil(serverURL, customViews2CollectionSlug)
    customFieldsURL = new AdminUrlUtil(serverURL, customFieldsSlug)
    disableDuplicateURL = new AdminUrlUtil(serverURL, disableDuplicateSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await reInitializeDB({
      serverURL,
      snapshotKey: 'adminTests1',
    })

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })

    adminRoutes = getRoutes({ customAdminRoutes })

    loginURL = `${serverURL}${adminRoutes.routes.admin}${adminRoutes.admin.routes.login}`
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'adminTests1',
    })

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })
  })

  describe('metadata', () => {
    test('should render custom page title suffix', async () => {
      await page.goto(`${serverURL}/admin`)
      await expect(page.title()).resolves.toMatch(/- Custom CMS$/)
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

    test('should render custom favicons', async () => {
      await page.goto(postsUrl.admin)
      const favicons = page.locator('link[rel="icon"]')

      await expect(favicons).toHaveCount(2)
      await expect(favicons.nth(0)).toHaveAttribute('href', /\/custom-favicon-dark\.[a-z\d]+\.png/)
      await expect(favicons.nth(1)).toHaveAttribute('media', '(prefers-color-scheme: dark)')
      await expect(favicons.nth(1)).toHaveAttribute('href', /\/custom-favicon-light\.[a-z\d]+\.png/)
    })

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
    test('should use custom logout route', async () => {
      await page.goto(`${serverURL}${adminRoutes.routes.admin}${adminRoutes.admin.routes.logout}`)

      await page.waitForURL(
        `${serverURL}${adminRoutes.routes.admin}${adminRoutes.admin.routes.logout}`,
      )

      await expect(() => expect(page.url()).not.toContain(loginURL)).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
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
      const link = page.locator('#nav-group-one-collection-ones')

      await expect(navGroup).toContainText('One')
      await expect(link).toBeVisible()

      await navGroup.click()
      await expect(link).toBeHidden()

      await navGroup.click()
      await expect(link).toBeVisible()
    })

    test('nav — should collapse and expand globals groups', async () => {
      await page.goto(postsUrl.admin)
      await openNav(page)

      const navGroup = page.locator('#nav-group-Group .nav-group__toggle')
      const link = page.locator('#nav-global-group-globals-one')

      await expect(navGroup).toContainText('Group')
      await expect(link).toBeVisible()

      await navGroup.click()
      await expect(link).toBeHidden()

      await navGroup.click()
      await expect(link).toBeVisible()
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
  })

  describe('custom views', () => {
    test('root — should render custom view', async () => {
      await page.goto(`${serverURL}${adminRoutes.routes.admin}${customViewPath}`)
      await page.waitForURL(`**${adminRoutes.routes.admin}${customViewPath}`)
      await expect(page.locator('h1#custom-view-title')).toContainText(customViewTitle)
    })

    test('root — should render custom nested view', async () => {
      await page.goto(`${serverURL}${adminRoutes.routes.admin}${customNestedViewPath}`)
      const pageURL = page.url()
      const pathname = new URL(pageURL).pathname
      expect(pathname).toEqual(`${adminRoutes.routes.admin}${customNestedViewPath}`)
      await expect(page.locator('h1#custom-view-title')).toContainText(customNestedViewTitle)
    })

    test('collection - should render custom tab view', async () => {
      await page.goto(customViewsURL.create)
      await page.locator('#field-title').fill('Test')
      await saveDocAndAssert(page)
      const pageURL = page.url()
      const customViewURL = `${pageURL}${customTabViewPath}`
      await page.goto(customViewURL)
      expect(page.url()).toEqual(customViewURL)
      await expect(page.locator('h1#custom-view-title')).toContainText(customTabViewTitle)
    })

    test('collection — should render custom nested tab view', async () => {
      await page.goto(customViewsURL.create)
      await page.locator('#field-title').fill('Test')
      await saveDocAndAssert(page)

      // wait for the update view to load
      await page.waitForURL(/\/(?!create$)[\w-]+$/)
      const pageURL = page.url()

      const customNestedTabViewURL = `${pageURL}${customNestedTabViewPath}`
      await page.goto(customNestedTabViewURL)
      await page.waitForURL(customNestedTabViewURL)
      await expect(page.locator('h1#custom-view-title')).toContainText(customNestedTabViewTitle)
    })

    test('collection — should render custom tab label', async () => {
      await page.goto(customViewsURL.create)
      await page.locator('#field-title').fill('Test')
      await saveDocAndAssert(page)

      // wait for the update view to load
      await page.waitForURL(/\/(?!create$)[\w-]+$/)
      const editTab = page.locator('.doc-tab a[tabindex="-1"]')

      await expect(editTab).toContainText(customEditLabel)
    })

    test('collection — should render custom tab component', async () => {
      await page.goto(customViewsURL.create)
      await page.locator('#field-title').fill('Test')
      await saveDocAndAssert(page)

      const customTab = page.locator(`.doc-tab a:has-text("${customTabLabel}")`)

      await expect(customTab).toBeVisible()
    })

    test('global — should render custom tab label', async () => {
      await page.goto(globalURL.global(customGlobalViews2GlobalSlug) + '/custom-tab-view')

      const title = page.locator('#custom-view-title')

      const docTab = page.locator('.doc-tab__link:has-text("Custom")')

      await expect(docTab).toBeVisible()
      await expect(title).toContainText('Custom Tab Label View')
    })

    test('global — should render custom tab component', async () => {
      await page.goto(globalURL.global(customGlobalViews2GlobalSlug) + '/custom-tab-component')
      const title = page.locator('#custom-view-title')

      const docTab = page.locator('.custom-doc-tab').first()

      await expect(docTab).toBeVisible()
      await expect(docTab).toContainText('Custom Tab Component')
      await expect(title).toContainText('Custom View With Tab Component')
    })
  })

  describe('custom fields', () => {
    test('renders custom label component', async () => {
      await page.goto(customFieldsURL.create)
      await page.waitForURL(customFieldsURL.create)
      await expect(page.locator('#custom-field-label')).toBeVisible()
    })

    test('renders custom description component', async () => {
      await page.goto(customFieldsURL.create)
      await page.waitForURL(customFieldsURL.create)
      await expect(page.locator('#custom-field-description')).toBeVisible()
    })

    // test('ensure custom components receive field props', async () => {
    //   await page.goto(customFieldsURL.create)
    //   await page.waitForURL(customFieldsURL.create)
    //   await expect(page.locator('#custom-field-label')).toContainText(
    //     'The max length of this field is: 100',
    //   )
    //   await expect(page.locator('#custom-field-description')).toContainText(
    //     'The max length of this field is: 100',
    //   )
    // })

    describe('field descriptions', () => {
      test('should render static field description', async () => {
        await page.goto(customFieldsURL.create)
        await page.waitForURL(customFieldsURL.create)
        await expect(page.locator('.field-description-descriptionAsString')).toContainText(
          'Static field description.',
        )
      })

      test('should render functional field description', async () => {
        await page.goto(customFieldsURL.create)
        await page.waitForURL(customFieldsURL.create)
        await page.locator('#field-descriptionAsFunction').fill('functional')
        await expect(page.locator('.field-description-descriptionAsFunction')).toContainText(
          'Function description',
        )
      })
    })

    test('should render component field description', async () => {
      await page.goto(customFieldsURL.create)
      await page.waitForURL(customFieldsURL.create)
      await page.locator('#field-descriptionAsComponent').fill('component')
      await expect(page.locator('.field-description-descriptionAsComponent')).toContainText(
        'Component description: descriptionAsComponent - component',
      )
    })

    test('should render custom error component', async () => {
      await page.goto(customFieldsURL.create)
      await page.waitForURL(customFieldsURL.create)
      const input = page.locator('input[id="field-customTextField"]')
      await input.fill('ab')
      await expect(input).toHaveValue('ab')
      const error = page.locator('.custom-error:near(input[id="field-customTextField"])')
      const submit = page.locator('button[type="button"][id="action-save"]')
      await submit.click()
      await expect(error).toHaveText('#custom-error')
    })

    test('should render beforeInput and afterInput', async () => {
      await page.goto(customFieldsURL.create)
      const input = page.locator('input[id="field-customTextField"]')

      const prevSibling = await input.evaluateHandle((el) => {
        return el.previousElementSibling
      })
      const prevSiblingText = await page.evaluate((el) => el.textContent, prevSibling)
      expect(prevSiblingText).toEqual('#before-input')

      const nextSibling = await input.evaluateHandle((el) => {
        return el.nextElementSibling
      })
      const nextSiblingText = await page.evaluate((el) => el.textContent, nextSibling)
      expect(nextSiblingText).toEqual('#after-input')
    })

    describe('select field', () => {
      test('should render custom select options', async () => {
        await page.goto(customFieldsURL.create)
        await page.waitForURL(customFieldsURL.create)
        await page.locator('#field-customSelectField .rs__control').click()
        await expect(page.locator('#field-customSelectField .rs__option')).toHaveCount(2)
      })
    })
  })

  describe('API view', () => {
    test('collection — should not show API tab when disabled in config', async () => {
      await page.goto(postsUrl.collection(noApiViewCollectionSlug))
      await page.locator('.collection-list .table a').click()
      await expect(page.locator('.doc-tabs__tabs-container')).not.toContainText('API')
    })

    test('collection — should not enable API route when disabled in config', async () => {
      const collectionItems = await payload.find({
        collection: noApiViewCollectionSlug,
        limit: 1,
      })
      expect(collectionItems.docs.length).toBe(1)
      await page.goto(
        `${postsUrl.collection(noApiViewGlobalSlug)}/${collectionItems.docs[0].id}/api`,
      )
      await expect(page.locator('.not-found')).toHaveCount(1)
    })

    test('collection — sidebar fields should respond to permission', async () => {
      const { id } = await createPost()
      await page.goto(postsUrl.edit(id))

      await expect(page.locator('#field-sidebarField')).toBeDisabled()
    })

    test('collection — depth field should have value 0 when empty', async () => {
      const { id } = await createPost()
      await page.goto(`${postsUrl.edit(id)}/api`)

      const depthField = page.locator('#field-depth')
      await depthField.fill('')
      await expect(depthField).toHaveValue('0')
    })

    test('global — should not show API tab when disabled in config', async () => {
      await page.goto(postsUrl.global(noApiViewGlobalSlug))
      await expect(page.locator('.doc-tabs__tabs-container')).not.toContainText('API')
    })

    test('global — should not enable API route when disabled in config', async () => {
      await page.goto(`${postsUrl.global(noApiViewGlobalSlug)}/api`)
      await expect(page.locator('.not-found')).toHaveCount(1)
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

  describe('preview button', () => {
    test('collection — should render preview button when `admin.preview` is set', async () => {
      const collectionWithPreview = new AdminUrlUtil(serverURL, postsCollectionSlug)
      await page.goto(collectionWithPreview.create)
      await page.waitForURL(collectionWithPreview.create)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('.btn.preview-btn')).toBeVisible()
    })

    test('collection — should not render preview button when `admin.preview` is not set', async () => {
      const collectionWithoutPreview = new AdminUrlUtil(serverURL, group1Collection1Slug)
      await page.goto(collectionWithoutPreview.create)
      await page.waitForURL(collectionWithoutPreview.create)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('.btn.preview-btn')).toBeHidden()
    })

    test('global — should render preview button when `admin.preview` is set', async () => {
      const globalWithPreview = new AdminUrlUtil(serverURL, globalSlug)
      await page.goto(globalWithPreview.global(globalSlug))
      await expect(page.locator('.btn.preview-btn')).toBeVisible()
    })

    test('global — should not render preview button when `admin.preview` is not set', async () => {
      const globalWithoutPreview = new AdminUrlUtil(serverURL, group1GlobalSlug)
      await page.goto(globalWithoutPreview.global(group1GlobalSlug))
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('.btn.preview-btn')).toBeHidden()
    })
  })

  describe('form state', () => {
    test('collection — should re-enable fields after save', async () => {
      await page.goto(postsUrl.create)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('#field-title')).toBeEnabled()
    })

    test('global — should re-enable fields after save', async () => {
      await page.goto(globalURL.global(globalSlug))
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('#field-title')).toBeEnabled()
    })
  })

  describe('document titles', () => {
    test('collection — should render fallback titles when creating new', async () => {
      await page.goto(postsUrl.create)
      await checkPageTitle(page, '[Untitled]')
      await checkBreadcrumb(page, 'Create New')
      await saveDocAndAssert(page)
      expect(true).toBe(true)
    })

    test('collection — should render `useAsTitle` field', async () => {
      await page.goto(postsUrl.create)
      await page.locator('#field-title')?.fill(title)
      await saveDocAndAssert(page)
      await wait(500)
      await checkPageTitle(page, title)
      await checkBreadcrumb(page, title)
      expect(true).toBe(true)
    })

    test('collection — should render `id` as `useAsTitle` fallback', async () => {
      const { id } = await createPost()
      const postURL = postsUrl.edit(id)
      await page.goto(postURL)
      await page.waitForURL(postURL)
      await wait(500)
      await page.locator('#field-title')?.fill('')
      await expect(page.locator('.doc-header__title.render-title:has-text("ID:")')).toBeVisible()
      await saveDocAndAssert(page)
    })

    test('global — should render custom, localized label', async () => {
      await page.goto(globalURL.global(globalSlug))
      await page.waitForURL(globalURL.global(globalSlug))
      await openNav(page)
      const label = 'My Global Label'
      const globalLabel = page.locator(`#nav-global-global`)
      await expect(globalLabel).toContainText(label)
      await globalLabel.click()
      await checkPageTitle(page, label)
      await checkBreadcrumb(page, label)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await checkPageTitle(page, label)
      await checkBreadcrumb(page, label)
    })

    test('global — should render simple label strings', async () => {
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)
      await openNav(page)
      const label = 'Group Globals 1'
      const globalLabel = page.locator(`#nav-global-group-globals-one`)
      await expect(globalLabel).toContainText(label)
      await globalLabel.click()
      await checkPageTitle(page, label)
      await checkBreadcrumb(page, label)
    })

    test('global — should render slug in sentence case as fallback', async () => {
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)
      await openNav(page)
      const label = 'Group Globals Two'
      const globalLabel = page.locator(`#nav-global-group-globals-two`)
      await expect(globalLabel).toContainText(label)
      await globalLabel.click()
      await checkPageTitle(page, label)
      await checkBreadcrumb(page, label)
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

  describe('drawers', () => {
    test('document drawers are visually stacking', async () => {
      await navigateToDoc(page, postsUrl)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await page
        .locator(
          '.field-type.relationship .relationship--single-value__drawer-toggler.doc-drawer__toggler',
        )
        .click()
      await wait(500)
      const drawer1Content = page.locator('[id^=doc-drawer_posts_1_] .drawer__content')
      await expect(drawer1Content).toBeVisible()
      const drawerLeft = await drawer1Content.boundingBox().then((box) => box.x)
      await drawer1Content
        .locator(
          '.field-type.relationship .relationship--single-value__drawer-toggler.doc-drawer__toggler',
        )
        .click()
      const drawer2Content = page.locator('[id^=doc-drawer_posts_2_] .drawer__content')
      await expect(drawer2Content).toBeVisible()
      const drawer2Left = await drawer2Content.boundingBox().then((box) => box.x)
      expect(drawer2Left > drawerLeft).toBe(true)
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

    test('should bulk delete', async () => {
      async function selectAndDeleteAll() {
        await page.goto(postsUrl.list)
        await page.locator('input#select-all').check()
        await page.locator('.delete-documents__toggle').click()
        await page.locator('#confirm-delete').click()
      }

      // First, delete all posts created by the seed
      await deleteAllPosts()
      await createPost()
      await createPost()
      await createPost()

      await page.goto(postsUrl.list)
      await selectAndDeleteAll()
      await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
        'Deleted 3 Posts successfully.',
      )
      await expect(page.locator('.collection-list__no-results')).toBeVisible()
    })

    test('should bulk update', async () => {
      // First, delete all posts created by the seed
      await deleteAllPosts()
      await createPost()
      await createPost()
      await createPost()

      const bulkTitle = 'Bulk update title'
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

      await titleInput.fill(bulkTitle)

      await page.locator('.form-submit button[type="submit"].edit-many__publish').click()
      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
        'Updated 3 Posts successfully.',
      )
      await expect(page.locator('.row-1 .cell-title')).toContainText(bulkTitle)
      await expect(page.locator('.row-2 .cell-title')).toContainText(bulkTitle)
      await expect(page.locator('.row-3 .cell-title')).toContainText(bulkTitle)
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
  })

  describe('custom IDs', () => {
    test('unnamed tab — should allow custom ID field', async () => {
      await page.goto(postsUrl.collection('customIdTab') + '/' + customIdCollectionId)

      const idField = page.locator('#field-id')

      await expect(idField).toHaveValue(customIdCollectionId)
    })

    test('row — should allow custom ID field', async () => {
      await page.goto(postsUrl.collection('customIdRow') + '/' + customIdCollectionId)

      const idField = page.locator('#field-id')

      await expect(idField).toHaveValue(customIdCollectionId)
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

async function deleteAllPosts() {
  await payload.delete({ collection: postsCollectionSlug, where: { id: { exists: true } } })
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
