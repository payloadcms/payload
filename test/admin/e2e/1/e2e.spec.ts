import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type { Config, Post } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  getRoutes,
  initPageConsoleErrorCatch,
  openNav,
  saveDocAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import {
  customAdminRoutes,
  customCollectionMetaTitle,
  customDefaultTabMetaTitle,
  customEditLabel,
  customNestedTabViewPath,
  customNestedTabViewTitle,
  customNestedViewPath,
  customNestedViewTitle,
  customRootViewMetaTitle,
  customTabLabel,
  customTabViewPath,
  customTabViewTitle,
  customVersionsTabMetaTitle,
  customViewMetaTitle,
  customViewPath,
  customViewTitle,
  protectedCustomNestedViewPath,
  publicCustomViewPath,
  slugPluralLabel,
} from '../../shared.js'
import {
  customFieldsSlug,
  customGlobalViews2GlobalSlug,
  customViews2CollectionSlug,
  globalSlug,
  postsCollectionSlug,
  settingsGlobalSlug,
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
  let postsUrl: AdminUrlUtil
  let globalURL: AdminUrlUtil
  let customViewsURL: AdminUrlUtil
  let customFieldsURL: AdminUrlUtil
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
    globalURL = new AdminUrlUtil(serverURL, globalSlug)
    customViewsURL = new AdminUrlUtil(serverURL, customViews2CollectionSlug)
    customFieldsURL = new AdminUrlUtil(serverURL, customFieldsSlug)

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

    test('root — should render public custom view', async () => {
      await page.goto(`${serverURL}${adminRoutes.routes.admin}${publicCustomViewPath}`)
      await page.waitForURL(`**${adminRoutes.routes.admin}${publicCustomViewPath}`)
      await expect(page.locator('h1#custom-view-title')).toContainText(customViewTitle)
    })

    test('root — should render protected nested custom view', async () => {
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
    test('should render custom field component', async () => {
      await page.goto(customFieldsURL.create)
      await page.waitForURL(customFieldsURL.create)
      await expect(page.locator('#field-customTextClientField')).toBeVisible()
    })

    test('renders custom label component', async () => {
      await page.goto(customFieldsURL.create)
      await page.waitForURL(customFieldsURL.create)
      await expect(page.locator('#custom-client-field-label')).toBeVisible()
      await expect(page.locator('#custom-server-field-label')).toBeVisible()
    })

    test('renders custom field description text', async () => {
      await page.goto(customFieldsURL.create)
      await page.waitForURL(customFieldsURL.create)
      await expect(page.locator('#custom-client-field-description')).toBeVisible()
      await expect(page.locator('#custom-server-field-description')).toBeVisible()
    })

    test('custom server components should receive field props', async () => {
      await page.goto(customFieldsURL.create)
      await page.waitForURL(customFieldsURL.create)
      await expect(
        page.locator('#custom-server-field-label', {
          hasText: exactText('Label: the max length of this field is: 100'),
        }),
      ).toBeVisible()

      await expect(
        page.locator('#custom-server-field-description', {
          hasText: exactText('Description: the max length of this field is: 100'),
        }),
      ).toBeVisible()
    })

    test('custom client components should receive field props', async () => {
      await page.goto(customFieldsURL.create)
      await page.waitForURL(customFieldsURL.create)
      await expect(
        page.locator('#custom-client-field-label', {
          hasText: exactText('Label: the max length of this field is: 100'),
        }),
      ).toBeVisible()
      await expect(
        page.locator('#custom-client-field-description', {
          hasText: exactText('Description: the max length of this field is: 100'),
        }),
      ).toBeVisible()
    })

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
      const input = page.locator('input[id="field-customTextClientField"]')
      await input.fill('ab')
      await expect(input).toHaveValue('ab')
      const error = page.locator('.custom-error:near(input[id="field-customTextClientField"])')
      const submit = page.locator('button[type="button"][id="action-save"]')
      await submit.click()
      await expect(error).toHaveText('#custom-error')
    })

    test('should render beforeInput and afterInput', async () => {
      await page.goto(customFieldsURL.create)
      const input = page.locator('input[id="field-customTextClientField"]')

      const prevSibling = await input.evaluateHandle((el) => {
        return el.previousElementSibling
      })

      const prevSiblingText = await page.evaluate((el) => el?.textContent, prevSibling)
      expect(prevSiblingText).toEqual('#before-input')

      const nextSibling = await input.evaluateHandle((el) => {
        return el.nextElementSibling
      })

      const nextSiblingText = await page.evaluate((el) => el?.textContent, nextSibling)
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

  describe('custom components', () => {
    test('should render custom header', async () => {
      await page.goto(`${serverURL}/admin`)
      const header = page.locator('.custom-header')
      await expect(header).toContainText('Here is a custom header')
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
