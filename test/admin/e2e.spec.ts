import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { wait } from 'payload/utilities'
import { mapAsync } from 'payload/utilities'
import qs from 'qs'

import type { Geo, Post } from './payload-types.js'
import type { Config } from './payload-types.js'

import {
  checkBreadcrumb,
  checkPageTitle,
  ensureAutoLoginAndCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  openDocControls,
  openDocDrawer,
  openNav,
  saveDocAndAssert,
  saveDocHotkeyAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import {
  customDefaultViewClass,
  customDefaultViewPath,
  customEditLabel,
  customMinimalViewClass,
  customMinimalViewPath,
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
} from './shared.js'
import {
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
} from './slugs.js'

const { beforeAll, beforeEach, describe } = test

const title = 'Title'
const description = 'Description'

let payload: PayloadTestSDK<Config>

import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'

import { reInitializeDB } from '../helpers/reInit.js'
import { POLL_TOPASS_TIMEOUT } from '../playwright.config.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('admin', () => {
  let page: Page
  let geoUrl: AdminUrlUtil
  let postsUrl: AdminUrlUtil
  let customViewsURL: AdminUrlUtil
  let disableDuplicateURL: AdminUrlUtil
  let serverURL: string

  beforeAll(async ({ browser }, testInfo) => {
    const prebuild = Boolean(process.env.CI)

    if (prebuild) testInfo.setTimeout(testInfo.timeout * 3)

    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      prebuild,
    }))
    geoUrl = new AdminUrlUtil(serverURL, geoCollectionSlug)
    postsUrl = new AdminUrlUtil(serverURL, postsCollectionSlug)
    customViewsURL = new AdminUrlUtil(serverURL, customViews2CollectionSlug)
    disableDuplicateURL = new AdminUrlUtil(serverURL, disableDuplicateSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'adminTests',
    })

    await ensureAutoLoginAndCompilationIsDone({ page, serverURL })
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
      await page.locator('.step-nav a[href="/admin"]').click()
      expect(page.url()).toContain(postsUrl.admin)
    })

    test('breadcrumbs — should navigate from document to collection', async () => {
      const { id } = await createPost()
      await page.goto(postsUrl.edit(id))
      const collectionBreadcrumb = page.locator(
        `.step-nav a[href="/admin/collections/${postsCollectionSlug}"]`,
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
    test('root — should render custom view without template', async () => {
      await page.goto(`${serverURL}/admin${customViewPath}`)
      await page.waitForURL(`**/admin${customViewPath}`)
      await expect(page.locator('h1#custom-view-title')).toContainText(customViewTitle)
      await expect(page.locator('.template-default')).toBeHidden()
      await expect(page.locator('.template-minimal')).toBeHidden()
    })

    test('root — should render custom nested view', async () => {
      await page.goto(`${serverURL}/admin${customNestedViewPath}`)
      const pageURL = page.url()
      const pathname = new URL(pageURL).pathname
      expect(pathname).toEqual(`/admin${customNestedViewPath}`)
      await expect(page.locator('h1#custom-view-title')).toContainText(customNestedViewTitle)
    })

    test('root - should render custom view with default template and custom class', async () => {
      await page.goto(`${serverURL}/admin${customDefaultViewPath}`)
      await expect(page.locator(`.template-default.${customDefaultViewClass}`)).toBeVisible()
      await expect(page.locator('.template-minimal')).toBeHidden()
    })

    test('root - should render custom view with minimal template and custom class', async () => {
      await page.goto(`${serverURL}/admin${customMinimalViewPath}`)
      await expect(page.locator(`.template-minimal.${customMinimalViewClass}`)).toBeVisible()
      await expect(page.locator('.template-default')).toBeHidden()
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
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)
      await openNav(page)
      const label = 'My Global Label'
      const globalLabel = page.locator(`#nav-global-global`)
      await expect(globalLabel).toContainText(label)
      await globalLabel.click()
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
      await saveDocAndAssert(page)
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
      await saveDocAndAssert(page)
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
      await expect(page.locator('.Toastify__toast--success')).toHaveText(
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
      await expect(page.locator('.Toastify__toast--success')).toContainText(
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

  describe('custom CSS', () => {
    test('should see custom css in admin UI', async () => {
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)
      await openNav(page)
      const navControls = page.locator('#custom-css')
      await expect(navControls).toHaveCSS('font-family', 'monospace')
    })
  })

  describe('list view', () => {
    const tableRowLocator = 'table > tbody > tr'

    beforeEach(async () => {
      // delete all posts created by the seed
      await deleteAllPosts()
      await page.goto(postsUrl.list)
      await page.waitForURL((url) => url.toString().startsWith(postsUrl.list))
      await expect(page.locator(tableRowLocator)).toBeHidden()

      await createPost({ title: 'post1' })
      await createPost({ title: 'post2' })
      await page.reload()
      await expect(page.locator(tableRowLocator)).toHaveCount(2)
    })

    describe('filtering', () => {
      test('should prefill search input from query param', async () => {
        await createPost({ title: 'dennis' })
        await createPost({ title: 'charlie' })

        // prefill search with "a" from the query param
        await page.goto(`${postsUrl.list}?search=dennis`)
        await page.waitForURL(`${postsUrl.list}?search=dennis`)

        // input should be filled out, list should filter
        await expect(page.locator('.search-filter__input')).toHaveValue('dennis')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)
      })

      test('should search by id with listSearchableFields', async () => {
        const { id } = await createPost()
        const url = `${postsUrl.list}?limit=10&page=1&search=${id}`
        await page.goto(url)
        await page.waitForURL(url)
        const tableItems = page.locator(tableRowLocator)
        await expect(tableItems).toHaveCount(1)
      })

      test('should search by id without listSearchableFields', async () => {
        const { id } = await createGeo()
        const url = `${geoUrl.list}?limit=10&page=1&search=${id}`
        await page.goto(url)
        await page.waitForURL(url)
        const tableItems = page.locator(tableRowLocator)
        await expect(tableItems).toHaveCount(1)
      })

      test('should search by title or description', async () => {
        await createPost({
          description: 'this is fun',
          title: 'find me',
        })

        await page.locator('.search-filter__input').fill('find me')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)

        await page.locator('.search-filter__input').fill('this is fun')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)
      })

      test('should toggle columns', async () => {
        const columnCountLocator = 'table > thead > tr > th'
        await createPost()

        await page.locator('.list-controls__toggle-columns').click()

        // track the number of columns before manipulating toggling any
        const numberOfColumns = await page.locator(columnCountLocator).count()

        // wait until the column toggle UI is visible and fully expanded
        await expect(page.locator('.column-selector')).toBeVisible()
        await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('ID')

        const idButton = page.locator(`.column-selector .column-selector__column`, {
          hasText: exactText('ID'),
        })

        // Remove ID column
        await idButton.click()

        // wait until .cell-id is not present on the page:
        await page.locator('.cell-id').waitFor({ state: 'detached' })

        await expect(page.locator(columnCountLocator)).toHaveCount(numberOfColumns - 1)
        await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('Number')

        // Add back ID column
        await idButton.click()
        await expect(page.locator('.cell-id').first()).toBeVisible()

        await expect(page.locator(columnCountLocator)).toHaveCount(numberOfColumns)
        await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('ID')
      })

      test('should link second cell', async () => {
        const { id } = await createPost()
        await page.reload()
        const linkCell = page.locator(`${tableRowLocator} td`).nth(1).locator('a')
        await expect(linkCell).toHaveAttribute('href', `/admin/collections/posts/${id}`)

        // open the column controls
        await page.locator('.list-controls__toggle-columns').click()
        // wait until the column toggle UI is visible and fully expanded
        await expect(page.locator('.list-controls__columns.rah-static--height-auto')).toBeVisible()

        // toggle off the ID column
        await page
          .locator('.column-selector .column-selector__column', {
            hasText: exactText('ID'),
          })
          .click()

        // wait until .cell-id is not present on the page:
        await page.locator('.cell-id').waitFor({ state: 'detached' })

        // recheck that the 2nd cell is still a link
        await expect(linkCell).toHaveAttribute('href', `/admin/collections/posts/${id}`)
      })

      test('should filter rows', async () => {
        // open the column controls
        await page.locator('.list-controls__toggle-columns').click()

        // wait until the column toggle UI is visible and fully expanded
        await expect(page.locator('.column-selector')).toBeVisible()
        await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('ID')

        // ensure the ID column is active
        const idButton = page.locator('.column-selector .column-selector__column', {
          hasText: exactText('ID'),
        })

        const id = (await page.locator('.cell-id').first().innerText()).replace('ID: ', '')

        const buttonClasses = await idButton.getAttribute('class')

        if (buttonClasses && !buttonClasses.includes('column-selector__column--active')) {
          await idButton.click()
          await expect(page.locator(tableRowLocator).first().locator('.cell-id')).toBeVisible()
        }

        await expect(page.locator(tableRowLocator)).toHaveCount(2)

        await page.locator('.list-controls__toggle-where').click()
        // wait until the filter UI is visible and fully expanded
        await expect(page.locator('.list-controls__where.rah-static--height-auto')).toBeVisible()

        await page.locator('.where-builder__add-first-filter').click()

        const operatorField = page.locator('.condition__operator')
        const valueField = page.locator('.condition__value input')

        await operatorField.click()

        const dropdownOptions = operatorField.locator('.rs__option')
        await dropdownOptions.locator('text=equals').click()

        await valueField.fill(id)

        await expect(page.locator(tableRowLocator)).toHaveCount(1)
        const firstId = await page.locator(tableRowLocator).first().locator('.cell-id').innerText()
        expect(firstId).toEqual(`ID: ${id}`)

        // Remove filter
        await page.locator('.condition__actions-remove').click()
        await expect(page.locator(tableRowLocator)).toHaveCount(2)
      })

      test('should reset filter value and operator on field update', async () => {
        const id = (await page.locator('.cell-id').first().innerText()).replace('ID: ', '')

        // open the column controls
        await page.locator('.list-controls__toggle-columns').click()
        await page.locator('.list-controls__toggle-where').click()
        await page.waitForSelector('.list-controls__where.rah-static--height-auto')
        await page.locator('.where-builder__add-first-filter').click()

        const operatorField = page.locator('.condition__operator')
        await operatorField.click()

        const dropdownOperatorOptions = operatorField.locator('.rs__option')
        await dropdownOperatorOptions.locator('text=equals').click()

        // execute filter (where ID equals id value)
        const valueField = page.locator('.condition__value > input')
        await valueField.fill(id)

        const filterField = page.locator('.condition__field')
        await filterField.click()

        // select new filter field of Number
        const dropdownFieldOptions = filterField.locator('.rs__option')
        await dropdownFieldOptions.locator('text=Number').click()

        // expect operator & value field to reset (be empty)
        await expect(operatorField.locator('.rs__placeholder')).toContainText('Select a value')
        await expect(valueField).toHaveValue('')
      })

      test('should accept where query from valid URL where parameter', async () => {
        // delete all posts created by the seed
        await deleteAllPosts()
        await page.goto(postsUrl.list)
        await expect(page.locator(tableRowLocator)).toBeHidden()

        await createPost({ title: 'post1' })
        await createPost({ title: 'post2' })
        await page.goto(postsUrl.list)
        await expect(page.locator(tableRowLocator)).toHaveCount(2)

        await page.goto(
          `${postsUrl.list}?limit=10&page=1&where[or][0][and][0][title][equals]=post1`,
        )

        await expect(page.locator('.react-select--single-value').first()).toContainText('Title')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)
      })

      test('should accept transformed where query from invalid URL where parameter', async () => {
        // delete all posts created by the seed
        await deleteAllPosts()
        await page.goto(postsUrl.list)
        await expect(page.locator(tableRowLocator)).toBeHidden()

        await createPost({ title: 'post1' })
        await createPost({ title: 'post2' })
        await page.goto(postsUrl.list)
        await expect(page.locator(tableRowLocator)).toHaveCount(2)

        // [title][equals]=post1 should be getting transformed into a valid where[or][0][and][0][title][equals]=post1
        await page.goto(`${postsUrl.list}?limit=10&page=1&where[title][equals]=post1`)

        await expect(page.locator('.react-select--single-value').first()).toContainText('Title')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)
      })

      test('should accept where query from complex, valid URL where parameter using the near operator', async () => {
        // We have one point collection with the point [5,-5] and one with [7,-7]. This where query should kick out the [5,-5] point
        await page.goto(
          `${
            new AdminUrlUtil(serverURL, 'geo').list
          }?limit=10&page=1&where[or][0][and][0][point][near]=6,-7,200000`,
        )

        await expect(page.getByPlaceholder('Enter a value')).toHaveValue('6,-7,200000')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)
      })

      test('should accept transformed where query from complex, invalid URL where parameter using the near operator', async () => {
        // We have one point collection with the point [5,-5] and one with [7,-7]. This where query should kick out the [5,-5] point
        await page.goto(
          `${
            new AdminUrlUtil(serverURL, 'geo').list
          }?limit=10&page=1&where[point][near]=6,-7,200000`,
        )

        await expect(page.getByPlaceholder('Enter a value')).toHaveValue('6,-7,200000')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)
      })

      test('should accept where query from complex, valid URL where parameter using the within operator', async () => {
        type Point = [number, number]
        const polygon: Point[] = [
          [3.5, -3.5], // bottom-left
          [3.5, -6.5], // top-left
          [6.5, -6.5], // top-right
          [6.5, -3.5], // bottom-right
          [3.5, -3.5], // back to starting point to close the polygon
        ]

        const whereQueryJSON = {
          point: {
            within: {
              type: 'Polygon',
              coordinates: [polygon],
            },
          },
        }

        const whereQuery = qs.stringify(
          {
            ...{ where: whereQueryJSON },
          },
          {
            addQueryPrefix: false,
          },
        )

        // We have one point collection with the point [5,-5] and one with [7,-7]. This where query should kick out the [7,-7] point, as it's not within the polygon
        await page.goto(`${new AdminUrlUtil(serverURL, 'geo').list}?limit=10&page=1&${whereQuery}`)

        await expect(page.getByPlaceholder('Enter a value')).toHaveValue('[object Object]')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)
      })
    })

    describe('table columns', () => {
      const reorderColumns = async () => {
        // open the column controls
        await page.locator('.list-controls__toggle-columns').click()
        // wait until the column toggle UI is visible and fully expanded
        await expect(page.locator('.list-controls__columns.rah-static--height-auto')).toBeVisible()

        const numberBoundingBox = await page
          .locator(`.column-selector .column-selector__column`, {
            hasText: exactText('Number'),
          })

          .boundingBox()

        const idBoundingBox = await page
          .locator(`.column-selector .column-selector__column`, {
            hasText: exactText('ID'),
          })
          .boundingBox()

        if (!numberBoundingBox || !idBoundingBox) return

        // drag the "number" column to the left of the "ID" column
        await page.mouse.move(numberBoundingBox.x + 2, numberBoundingBox.y + 2, { steps: 10 })
        await page.mouse.down()
        await wait(300)

        await page.mouse.move(idBoundingBox.x - 2, idBoundingBox.y - 2, { steps: 10 })
        await page.mouse.up()

        // ensure the "number" column is now first
        await expect(
          page.locator('.list-controls .column-selector .column-selector__column').first(),
        ).toHaveText('Number')
        await expect(page.locator('table thead tr th').nth(1)).toHaveText('Number')

        // TODO: This wait makes sure the preferences are actually saved. Just waiting for the UI to update is not enough. We should replace this wait
        await wait(1000)
      }

      test('should drag to reorder columns and save to preferences', async () => {
        await createPost()

        await reorderColumns()

        // reload to ensure the preferred order was stored in the database
        await page.reload()
        await expect(
          page.locator('.list-controls .column-selector .column-selector__column').first(),
        ).toHaveText('Number')
        await expect(page.locator('table thead tr th').nth(1)).toHaveText('Number')
      })

      test('should render drawer columns in order', async () => {
        // Re-order columns like done in the previous test
        await createPost()
        await reorderColumns()

        await page.reload()

        await createPost()
        await page.goto(postsUrl.create)

        await openDocDrawer(page, '.rich-text .list-drawer__toggler')

        const listDrawer = page.locator('[id^=list-drawer_1_]')
        await expect(listDrawer).toBeVisible()

        const collectionSelector = page.locator(
          '[id^=list-drawer_1_] .list-drawer__select-collection.react-select',
        )

        // select the "Post" collection
        await collectionSelector.click()
        await page
          .locator(
            '[id^=list-drawer_1_] .list-drawer__select-collection.react-select .rs__option',
            {
              hasText: exactText('Post'),
            },
          )
          .click()

        // open the column controls
        const columnSelector = page.locator('[id^=list-drawer_1_] .list-controls__toggle-columns')
        await columnSelector.click()
        // wait until the column toggle UI is visible and fully expanded
        await expect(page.locator('.list-controls__columns.rah-static--height-auto')).toBeVisible()

        // ensure that the columns are in the correct order
        await expect(
          page
            .locator(
              '[id^=list-drawer_1_] .list-controls .column-selector .column-selector__column',
            )
            .first(),
        ).toHaveText('Number')
      })

      test('should retain preferences when changing drawer collections', async () => {
        await page.goto(postsUrl.create)

        // Open the drawer
        await openDocDrawer(page, '.rich-text .list-drawer__toggler')
        const listDrawer = page.locator('[id^=list-drawer_1_]')
        await expect(listDrawer).toBeVisible()

        const collectionSelector = page.locator(
          '[id^=list-drawer_1_] .list-drawer__select-collection.react-select',
        )
        const columnSelector = page.locator('[id^=list-drawer_1_] .list-controls__toggle-columns')

        // open the column controls
        await columnSelector.click()
        // wait until the column toggle UI is visible and fully expanded
        await expect(page.locator('.list-controls__columns.rah-static--height-auto')).toBeVisible()

        // deselect the "id" column
        await page
          .locator(
            '[id^=list-drawer_1_] .list-controls .column-selector .column-selector__column',
            {
              hasText: exactText('ID'),
            },
          )
          .click()

        // select the "Post" collection
        await collectionSelector.click()
        await page
          .locator(
            '[id^=list-drawer_1_] .list-drawer__select-collection.react-select .rs__option',
            {
              hasText: exactText('Post'),
            },
          )
          .click()

        // deselect the "number" column
        await page
          .locator(
            '[id^=list-drawer_1_] .list-controls .column-selector .column-selector__column',
            {
              hasText: exactText('Number'),
            },
          )
          .click()

        // select the "User" collection again
        await collectionSelector.click()
        await page
          .locator(
            '[id^=list-drawer_1_] .list-drawer__select-collection.react-select .rs__option',
            {
              hasText: exactText('User'),
            },
          )
          .click()

        // ensure that the "id" column is still deselected
        await expect(
          page
            .locator(
              '[id^=list-drawer_1_] .list-controls .column-selector .column-selector__column',
            )
            .first(),
        ).not.toHaveClass('column-selector__column--active')

        // select the "Post" collection again
        await collectionSelector.click()

        await page
          .locator(
            '[id^=list-drawer_1_] .list-drawer__select-collection.react-select .rs__option',
            {
              hasText: exactText('Post'),
            },
          )
          .click()

        // ensure that the "number" column is still deselected
        await expect(
          page
            .locator(
              '[id^=list-drawer_1_] .list-controls .column-selector .column-selector__column',
            )
            .first(),
        ).not.toHaveClass('column-selector__column--active')
      })

      test('should render custom table cell component', async () => {
        await createPost()
        await page.goto(postsUrl.list)
        await expect(
          page.locator('table > thead > tr > th', {
            hasText: exactText('Demo UI Field'),
          }),
        ).toBeVisible()
      })
    })

    describe('multi-select', () => {
      beforeEach(async () => {
        // delete all posts created by the seed
        await deleteAllPosts()

        await createPost()
        await createPost()
        await createPost()
      })

      test('should select multiple rows', async () => {
        await page.reload()
        const selectAll = page.locator('.checkbox-input:has(#select-all)')
        await page.locator('.row-1 .cell-_select input').check()

        const indeterminateSelectAll = selectAll.locator('.checkbox-input__icon.partial')
        expect(indeterminateSelectAll).toBeDefined()

        await selectAll.locator('input').click()
        const emptySelectAll = selectAll.locator('.checkbox-input__icon:not(.check):not(.partial)')
        await expect(emptySelectAll).toHaveCount(0)

        await selectAll.locator('input').click()
        const checkSelectAll = selectAll.locator('.checkbox-input__icon.check')
        expect(checkSelectAll).toBeDefined()
      })

      test('should delete many', async () => {
        await page.goto(postsUrl.list)
        await page.waitForURL(postsUrl.list)
        // delete should not appear without selection
        await expect(page.locator('#confirm-delete')).toHaveCount(0)
        // select one row
        await page.locator('.row-1 .cell-_select input').check()

        // delete button should be present
        await expect(page.locator('#confirm-delete')).toHaveCount(1)

        await page.locator('.row-2 .cell-_select input').check()

        await page.locator('.delete-documents__toggle').click()
        await page.locator('#confirm-delete').click()
        await expect(page.locator('.cell-_select')).toHaveCount(1)
      })
    })

    describe('pagination', () => {
      test('should paginate', async () => {
        await deleteAllPosts()
        await mapAsync([...Array(11)], async () => {
          await createPost()
        })
        await page.reload()

        const pageInfo = page.locator('.collection-list__page-info')
        const perPage = page.locator('.per-page')
        const paginator = page.locator('.paginator')
        const tableItems = page.locator(tableRowLocator)

        await expect(tableItems).toHaveCount(10)
        await expect(pageInfo).toHaveText('1-10 of 11')
        await expect(perPage).toContainText('Per Page: 10')

        // Forward one page and back using numbers
        await paginator.locator('button').nth(1).click()
        await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('page=2')
        await expect(tableItems).toHaveCount(1)
        await paginator.locator('button').nth(0).click()
        await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('page=1')
        await expect(tableItems).toHaveCount(10)
      })
    })

    // TODO: Troubleshoot flaky suite
    describe('sorting', () => {
      beforeEach(async () => {
        // delete all posts created by the seed
        await deleteAllPosts()
        await createPost({ number: 1 })
        await createPost({ number: 2 })
      })

      test('should sort', async () => {
        await page.reload()
        const upChevron = page.locator('#heading-number .sort-column__asc')
        const downChevron = page.locator('#heading-number .sort-column__desc')

        await upChevron.click()
        await page.waitForURL(/sort=number/)

        await expect(page.locator('.row-1 .cell-number')).toHaveText('1')
        await expect(page.locator('.row-2 .cell-number')).toHaveText('2')

        await downChevron.click()
        await page.waitForURL(/sort=-number/)

        await expect(page.locator('.row-1 .cell-number')).toHaveText('2')
        await expect(page.locator('.row-2 .cell-number')).toHaveText('1')
      })
    })

    describe('i18n', () => {
      test('should display translated collections and globals config options', async () => {
        await page.goto(postsUrl.list)

        // collection label
        await expect(page.locator('#nav-posts')).toContainText('Posts')

        // global label
        await expect(page.locator('#nav-global-global')).toContainText('Global')

        // view description
        await expect(page.locator('.view-description')).toContainText('Description')
      })

      test('should display translated field titles', async () => {
        await createPost()

        // column controls
        await page.locator('.list-controls__toggle-columns').click()
        await expect(
          page.locator('.column-selector__column', {
            hasText: exactText('Title'),
          }),
        ).toHaveText('Title')

        // filters
        await page.locator('.list-controls__toggle-where').click()
        await page.locator('.where-builder__add-first-filter').click()
        await page.locator('.condition__field .rs__control').click()
        const options = page.locator('.rs__option')
        await expect(options.locator('text=Title')).toHaveText('Title')

        // list columns
        await expect(page.locator('#heading-title .sort-column__label')).toHaveText('Title')
        await expect(page.locator('.search-filter input')).toHaveAttribute('placeholder', /(Title)/)
      })

      test('should use fallback language on field titles', async () => {
        // change language German
        await page.goto(postsUrl.account)
        await page.locator('.payload-settings__language .react-select').click()
        const languageSelect = page.locator('.rs__option')
        // text field does not have a 'de' label
        await languageSelect.locator('text=Deutsch').click()

        await page.goto(postsUrl.list)
        await page.locator('.list-controls__toggle-columns').click()
        // expecting the label to fall back to english as default fallbackLng
        await expect(
          page.locator('.column-selector__column', {
            hasText: exactText('Title'),
          }),
        ).toHaveText('Title')
      })
    })
  })

  describe('field descriptions', () => {
    test('should render static field description', async () => {
      await page.goto(postsUrl.create)
      await expect(page.locator('.field-description-descriptionAsString')).toContainText(
        'Static field description.',
      )
    })
    test('should render functional field description', async () => {
      await page.goto(postsUrl.create)
      await page.locator('#field-descriptionAsFunction').fill('functional')
      await expect(page.locator('.field-description-descriptionAsFunction')).toContainText(
        'Function description',
      )
    })
    test('should render component field description', async () => {
      await page.goto(postsUrl.create)
      await page.locator('#field-descriptionAsComponent').fill('component')
      await expect(page.locator('.field-description-descriptionAsComponent')).toContainText(
        'Component description: descriptionAsComponent - component',
      )
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
