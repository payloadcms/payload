import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { wait } from 'payload/shared'

import type { Config, Post } from '../../payload-types.js'

import {
  checkBreadcrumb,
  checkPageTitle,
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/shared/initPayloadE2ENoConfig.js'
import {
  BASE_PATH,
  customAdminRoutes,
  customEditLabel,
  customNestedTabViewPath,
  customNestedTabViewTitle,
  customTabAdminDescription,
  customTabComponent,
  customTabLabel,
  customTabViewPath,
  customTabViewTitle,
  overriddenDefaultRouteTabLabel,
} from '../../shared.js'
import {
  customDocumentControlsSlug,
  customFieldsSlug,
  customGlobalDocumentControlsSlug,
  customGlobalViews2GlobalSlug,
  customViews2CollectionSlug,
  editMenuItemsSlug,
  globalSlug,
  group1Collection1Slug,
  group1GlobalSlug,
  localizedCollectionSlug,
  noApiViewCollectionSlug,
  noApiViewGlobalSlug,
  placeholderCollectionSlug,
  postsCollectionSlug,
  reorderTabsSlug,
} from '../../slugs.js'
process.env.NEXT_BASE_PATH = BASE_PATH

const { beforeAll, beforeEach, describe } = test

const title = 'Title'
const description = 'Description'

let payload: PayloadTestSDK<Config>

import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/shared/sdk/index.js'

import { navigateToDoc } from '../../../helpers/e2e/navigateToDoc.js'
import { selectInput } from '../../../helpers/e2e/selectInput.js'
import { openDocDrawer } from '../../../helpers/e2e/toggleDocDrawer.js'
import { openNav } from '../../../helpers/e2e/toggleNav.js'
import { reInitializeDB } from '../../../helpers/shared/clearAndSeed/reInitializeDB.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

describe('Document View', () => {
  let page: Page
  let postsUrl: AdminUrlUtil
  let globalURL: AdminUrlUtil
  let serverURL: string
  let customViewsURL: AdminUrlUtil
  let customDocumentControlsURL: AdminUrlUtil
  let customFieldsURL: AdminUrlUtil
  let placeholderURL: AdminUrlUtil
  let collectionCustomViewPathId: string
  let editMenuItemsURL: AdminUrlUtil
  let reorderTabsURL: AdminUrlUtil
  let localizedURL: AdminUrlUtil

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
    customDocumentControlsURL = new AdminUrlUtil(serverURL, customDocumentControlsSlug)
    customFieldsURL = new AdminUrlUtil(serverURL, customFieldsSlug)
    placeholderURL = new AdminUrlUtil(serverURL, placeholderCollectionSlug)
    editMenuItemsURL = new AdminUrlUtil(serverURL, editMenuItemsSlug)
    reorderTabsURL = new AdminUrlUtil(serverURL, reorderTabsSlug)
    localizedURL = new AdminUrlUtil(serverURL, localizedCollectionSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'adminTests',
    })

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })
  })

  describe('API view', () => {
    test('collection — should not show API tab when disabled in config', async () => {
      await page.goto(postsUrl.collection(noApiViewCollectionSlug))
      // Wait for hydration
      await wait(1000)
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
        `${postsUrl.collection(noApiViewGlobalSlug)}/${collectionItems?.docs[0]?.id}/api`,
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

  describe('preview button', () => {
    test('collection — should render preview button when `admin.preview` is set', async () => {
      const collectionWithPreview = new AdminUrlUtil(serverURL, postsCollectionSlug)
      await page.goto(collectionWithPreview.create)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('#preview-button')).toBeVisible()
    })

    test('collection — should not render preview button when `admin.preview` is not set', async () => {
      const collectionWithoutPreview = new AdminUrlUtil(serverURL, group1Collection1Slug)
      await page.goto(collectionWithoutPreview.create)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('#preview-button')).toBeHidden()
    })

    test('global — should render preview button when `admin.preview` is set', async () => {
      const globalWithPreview = new AdminUrlUtil(serverURL, globalSlug)
      await page.goto(globalWithPreview.global(globalSlug))
      await expect(page.locator('#preview-button')).toBeVisible()
    })

    test('global — should not render preview button when `admin.preview` is not set', async () => {
      const globalWithoutPreview = new AdminUrlUtil(serverURL, group1GlobalSlug)
      await page.goto(globalWithoutPreview.global(group1GlobalSlug))
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('#preview-button')).toBeHidden()
    })
  })

  describe('document titles', () => {
    test('collection — should render fallback titles when creating new', async () => {
      await page.goto(postsUrl.create)
      await checkPageTitle(page, '[Untitled]')
      await checkBreadcrumb(page, 'Create New')
      await saveDocAndAssert(page)
    })

    test('collection — should render `useAsTitle` field', async () => {
      await page.goto(postsUrl.create)
      await page.locator('#field-title')?.fill(title)
      await saveDocAndAssert(page)
      await wait(500)
      await checkPageTitle(page, title)
      await checkBreadcrumb(page, title)
    })

    test('collection — should render `id` as `useAsTitle` fallback', async () => {
      const { id } = await createPost()
      const postURL = postsUrl.edit(id)
      await page.goto(postURL)
      await wait(500)
      await page.locator('#field-title')?.fill('')
      await expect(page.locator('.doc-header__title.render-title:has-text("ID:")')).toBeVisible()
      await saveDocAndAssert(page)
    })

    test('global — should render custom, localized label', async () => {
      await page.goto(globalURL.global(globalSlug))
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
      await openNav(page)
      const label = 'Group Globals Two'
      const globalLabel = page.locator(`#nav-global-group-globals-two`)
      await expect(globalLabel).toContainText(label)
      await globalLabel.click()
      await checkPageTitle(page, label)
      await checkBreadcrumb(page, label)
    })
  })

  describe('breadcrumbs', () => {
    test('List drawer should not effect underlying breadcrumbs', async () => {
      await navigateToDoc(page, postsUrl)

      await expect(page.locator('.step-nav.app-header__step-nav a').nth(1)).toHaveText('Posts')

      await page.locator('#field-upload button.upload__listToggler').click()
      await expect(page.locator('[id^=list-drawer_1_]')).toBeVisible()
      await wait(100) // wait for the component to re-render

      await expect(
        page.locator('.step-nav.app-header__step-nav .step-nav__last'),
      ).not.toContainText('Uploads')

      await expect(page.locator('.step-nav.app-header__step-nav a').nth(1)).toHaveText('Posts')
    })
  })

  describe('custom document views', () => {
    test('collection — should render custom tab view', async () => {
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
      await expect(page.locator('h1#custom-view-title')).toContainText(customNestedTabViewTitle)
    })

    test('collection — should render custom tab label', async () => {
      await page.goto(customViewsURL.create)
      await page.locator('#field-title').fill('Test')
      await saveDocAndAssert(page)

      // wait for the update view to load
      await page.waitForURL(/\/(?!create$)[\w-]+$/)
      const editTab = page.locator(`.doc-tab:has-text("${customEditLabel}")`)

      await expect(editTab).toBeVisible()
    })

    test('collection - should allow to override the tab for the default view', async () => {
      await page.goto(customViewsURL.create)
      await page.locator('#field-title').fill('Test')
      await saveDocAndAssert(page)

      const customTab = page.locator(
        `.custom-doc-tab a:has-text("${overriddenDefaultRouteTabLabel}")`,
      )

      await expect(customTab).toBeVisible()
    })

    test('collection — should render custom tab component', async () => {
      await page.goto(customViewsURL.create)
      await page.locator('#field-title').fill('Test')
      await saveDocAndAssert(page)

      const customTab = page.locator(`a.doc-tab:has-text("${customTabLabel}")`)

      await expect(customTab).toBeVisible()
    })

    test('global — should render custom tab label', async () => {
      await page.goto(globalURL.global(customGlobalViews2GlobalSlug) + '/custom-tab-view')

      const title = page.locator('#custom-view-title')

      const docTab = page.locator('.doc-tab:has-text("Custom")')

      await expect(docTab).toBeVisible()
      await expect(title).toContainText('Custom Tab Label View')
    })

    test('global — should render custom tab component', async () => {
      await page.goto(globalURL.global(customGlobalViews2GlobalSlug) + '/custom-tab-component')
      const title = page.locator('#custom-view-title')

      const docTab = page.locator('.custom-doc-tab').first()

      await expect(docTab).toBeVisible()
      await expect(docTab).toContainText(customTabComponent)
      await expect(title).toContainText('Custom View With Tab Component')
    })

    test('global — should allow to override the tab for the default view', async () => {
      await page.goto(globalURL.global(customGlobalViews2GlobalSlug))

      const customTab = page.locator(
        `.custom-doc-tab a:has-text("${overriddenDefaultRouteTabLabel}")`,
      )

      await expect(customTab).toBeVisible()
    })
  })

  describe('drawers', () => {
    test('document drawers do not unmount across save events', async () => {
      // Navigate to a post document
      await navigateToDoc(page, postsUrl)

      // Open the relationship drawer
      await page
        .locator('.field-type.relationship .relationship--single-value__drawer-toggler')
        .click()

      const drawer = page.locator('[id^=doc-drawer_posts_1_]')
      const drawerEditView = drawer.locator('.drawer__content .collection-edit')
      await expect(drawerEditView).toBeVisible()

      const drawerTitleField = drawerEditView.locator('#field-title')
      const testTitle = 'Test Title for Persistence'
      await drawerTitleField.fill(testTitle)
      await expect(drawerTitleField).toHaveValue(testTitle)

      await drawerEditView.evaluate((el) => {
        el.setAttribute('data-test-instance', 'This is a test')
      })

      await expect(drawerEditView).toHaveAttribute('data-test-instance', 'This is a test')

      await saveDocAndAssert(page, '[id^=doc-drawer_posts_1_] .drawer__content #action-save')

      await expect(drawerEditView).toBeVisible()
      await expect(drawerTitleField).toHaveValue(testTitle)

      // Verify the element instance hasn't changed (i.e., it wasn't re-mounted and discarded the custom attribute)
      await expect
        .poll(async () => {
          return await drawerEditView.getAttribute('data-test-instance')
        })
        .toBe('This is a test')
    })

    test('document drawers are visually stacking', async () => {
      await navigateToDoc(page, postsUrl)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)

      await page
        .locator('.field-type.relationship .relationship--single-value__drawer-toggler')
        .click()

      await wait(500)

      const drawer1Content = page.locator('[id^=doc-drawer_posts_1_] .drawer__content')
      await expect(drawer1Content).toBeVisible()

      const drawer1Box = await drawer1Content.boundingBox()
      await expect.poll(() => drawer1Box).not.toBeNull()
      const drawerLeft = drawer1Box!.x

      await drawer1Content
        .locator('.field-type.relationship .relationship--single-value__drawer-toggler')
        .click()

      const drawer2Content = page.locator('[id^=doc-drawer_posts_2_] .drawer__content')
      await expect(drawer2Content).toBeVisible()

      const drawer2Box = await drawer2Content.boundingBox()
      await expect.poll(() => drawer2Box).not.toBeNull()
      const drawer2Left = drawer2Box!.x

      await expect.poll(() => drawer2Left > drawerLeft).toBe(true)
    })

    test('document drawer displays a link to document', async () => {
      await navigateToDoc(page, postsUrl)

      // change the relationship to a document which is a different one than the current one
      await page.locator('#field-relationship').click()
      await wait(200)

      await page.locator('#field-relationship .rs__option').nth(2).click()
      await wait(500)
      await saveDocAndAssert(page)

      // open relationship drawer
      await page
        .locator('.field-type.relationship .relationship--single-value__drawer-toggler')
        .click()
      await wait(200)

      const drawer1Content = page.locator('[id^=doc-drawer_posts_1_] .drawer__content')
      await expect(drawer1Content).toBeVisible()

      // modify the title to trigger the leave page modal
      await page.locator('.drawer__content #field-title').fill('New Title')
      await wait(200)

      // Open link in a new tab by holding down the Meta or Control key
      const documentLink = page.locator('.id-label a')
      const documentId = String(await documentLink.textContent())
      await documentLink.click()
      await wait(200)

      const leavePageModal = page.locator('#leave-without-saving #confirm-action').last()
      await expect(leavePageModal).toBeVisible()

      await leavePageModal.click()
      await page.waitForURL(postsUrl.edit(documentId))
    })

    test('document can be opened in a new tab from within the drawer', async () => {
      await navigateToDoc(page, postsUrl)
      await page
        .locator('.field-type.relationship .relationship--single-value__drawer-toggler')
        .click()
      await wait(500)
      const drawer1Content = page.locator('[id^=doc-drawer_posts_1_] .drawer__content')
      await expect(drawer1Content).toBeVisible()

      const currentUrl = page.url()

      // Open link in a new tab by holding down the Meta or Control key
      const documentLink = page.locator('.id-label a')
      const documentId = String(await documentLink.textContent())
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        documentLink.click({ modifiers: ['ControlOrMeta'] }),
      ])

      // Wait for navigation to complete in the new tab and ensure correct URL
      await expect(newPage.locator('.doc-header')).toBeVisible()
      // using contain here, because after load the lists view will add query params like "?limit=10"
      expect(newPage.url()).toContain(postsUrl.edit(documentId))

      // Ensure the original page did not change
      expect(page.url()).toBe(currentUrl)
    })

    test('document drawer displays AfterHeader components', async () => {
      await navigateToDoc(page, postsUrl)
      await page
        .locator('.field-type.relationship .relationship--single-value__drawer-toggler')
        .click()
      await wait(500)
      const drawer1Content = page.locator('[id^=doc-drawer_posts_1_] .drawer__content')
      await expect(drawer1Content).toBeVisible()

      const afterHeader = page.locator('[id^=doc-drawer_posts_1_] .doc-drawer__after-header')
      await expect(afterHeader).toBeVisible()
    })
  })

  describe('descriptions', () => {
    test('should render tab admin description', async () => {
      await page.goto(postsUrl.create)

      const tabsContent = page.locator('.tabs-field__content-wrap')
      await expect(tabsContent.locator('.field-description')).toHaveText(customTabAdminDescription)
    })

    test('should render tab admin description as a translation function', async () => {
      await page.goto(postsUrl.create)

      const secondTab = page.locator('.tabs-field__tab-button').nth(1)
      await secondTab.click()

      await wait(500)

      const tabsContent = page.locator('.tabs-field__content-wrap')
      await expect(
        tabsContent.locator('.field-description', { hasText: `t:${customTabAdminDescription}` }),
      ).toBeVisible()
    })
  })

  describe('collection — custom document controls', () => {
    test('should render status component', async () => {
      await navigateToDoc(page, postsUrl)
      const statusComponent = page.locator('.doc-controls__status > .status')
      await expect(statusComponent).toBeVisible()
      await expect(statusComponent).toContainText('Status: Draft')
    })

    test('should render custom status component', async () => {
      await navigateToDoc(page, customDocumentControlsURL)
      const statusComponent = page.locator('#custom-status')
      await expect(statusComponent).toBeVisible()
      await expect(statusComponent).toContainText('#custom-status')
    })
  })

  describe('global — custom document controls', () => {
    test('should render status component', async () => {
      await page.goto(globalURL.global(globalSlug))
      const statusComponent = page.locator('.doc-controls__status > .status')
      await expect(statusComponent).toBeVisible()
      await expect(statusComponent).toContainText('Status: Draft')
    })

    test('should render custom status component', async () => {
      await page.goto(globalURL.global(customGlobalDocumentControlsSlug))
      const statusComponent = page.locator('#custom-status')
      await expect(statusComponent).toBeVisible()
      await expect(statusComponent).toContainText('#custom-status')
    })
  })

  describe('custom fields', () => {
    test('should render custom field component', async () => {
      await page.goto(customFieldsURL.create)
      await expect(page.locator('#field-customTextClientField')).toBeVisible()
    })

    test('renders custom label component', async () => {
      await page.goto(customFieldsURL.create)
      await expect(page.locator('#custom-client-field-label')).toBeVisible()
      await expect(page.locator('#custom-server-field-label')).toBeVisible()
    })

    test('renders custom field description text', async () => {
      await page.goto(customFieldsURL.create)
      await expect(page.locator('#custom-client-field-description')).toBeVisible()
      await expect(page.locator('#custom-server-field-description')).toBeVisible()
    })

    test('custom server components should receive field props', async () => {
      await page.goto(customFieldsURL.create)
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

    test('custom select input can have its value cleared', async () => {
      await page.goto(customFieldsURL.create)
      await expect(page.locator('#field-customSelectInput')).toBeVisible()

      await page.locator('#field-customSelectInput .rs__control').click()
      await page.locator('#field-customSelectInput .rs__option').first().click()

      await expect(page.locator('#field-customSelectInput .rs__single-value')).toHaveText(
        'Option 1',
      )

      await page.locator('.clear-value').click()
      await expect(page.locator('#field-customSelectInput .rs__placeholder')).toHaveText(
        'Select a value',
      )
    })

    describe('field descriptions', () => {
      test('should render static field description', async () => {
        await page.goto(customFieldsURL.create)

        await expect(page.locator('.field-description-descriptionAsString')).toContainText(
          'Static field description.',
        )
      })

      test('should render functional field description', async () => {
        await page.goto(customFieldsURL.create)
        await page.locator('#field-descriptionAsFunction').fill('functional')
        await expect(page.locator('.field-description-descriptionAsFunction')).toContainText(
          'Function description',
        )
      })
    })

    test('should render component field description', async () => {
      await page.goto(customFieldsURL.create)
      await page.locator('#field-descriptionAsComponent').fill('component')
      await expect(page.locator('.field-description-descriptionAsComponent')).toContainText(
        'Component description: descriptionAsComponent - component',
      )
    })

    test('should render custom error component', async () => {
      await page.goto(customFieldsURL.create)
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
        await page.locator('#field-customSelectField .rs__control').click()
        await expect(page.locator('#field-customSelectField .rs__option')).toHaveCount(2)
      })

      test('should render custom multi select options', async () => {
        await page.goto(customFieldsURL.create)
        await page.locator('#field-customMultiSelectField .rs__control').click()
        await expect(page.locator('#field-customMultiSelectField .rs__option')).toHaveCount(2)
      })

      test('should allow selecting multiple values in custom multi select', async () => {
        await page.goto(customFieldsURL.create)

        const control = page.locator('#field-customMultiSelectField .rs__control')

        await control.click()
        await page.locator('.rs__option', { hasText: 'Label 1' }).click()
        await expect(page.locator('#field-customMultiSelectField .rs__multi-value')).toHaveCount(1)

        await control.click()
        await page.locator('.rs__option', { hasText: 'Label 2' }).click()
        await expect(page.locator('#field-customMultiSelectField .rs__multi-value')).toHaveCount(2)
      })
    })
  })

  describe('publish button', () => {
    test('should show publish active locale button with defaultLocalePublishOption set to active', async () => {
      await navigateToDoc(page, localizedURL)
      const publishButton = page.locator('#action-save')
      await expect(publishButton).toBeVisible()
      await expect(publishButton).toContainText('Publish in English')
    })

    test('should not show publish active locale button with defaultLocalePublishOption set to active but no localized fields', async () => {
      await navigateToDoc(page, postsUrl)
      const publishButton = page.locator('#action-save')
      await expect(publishButton).toBeVisible()
      await expect(publishButton).toContainText('Publish changes')
      await expect(publishButton).not.toContainText('Publish in')
    })
  })

  describe('reserved field names', () => {
    test('should allow creation of field named file in non-upload enabled collection', async () => {
      await page.goto(postsUrl.create)
      const fileField = page.locator('#field-file')
      await fileField.fill('some file text')
      await saveDocAndAssert(page)

      await expect(fileField).toHaveValue('some file text')
    })
  })

  describe('custom document controls', () => {
    test('should show custom elements in document controls in collection', async () => {
      await page.goto(postsUrl.create)
      const customDraftButton = page.locator('#custom-draft-button')
      const customSaveButton = page.locator('#custom-save-button')

      await expect(customDraftButton).toBeVisible()
      await expect(customSaveButton).toBeVisible()
    })

    test('should show custom elements in document controls in global', async () => {
      await page.goto(globalURL.global(globalSlug))
      const customDraftButton = page.locator('#custom-draft-button')

      await expect(customDraftButton).toBeVisible()
    })
  })

  describe('reordering tabs', () => {
    beforeEach(async () => {
      await page.goto(reorderTabsURL.create)
      await page.locator('#field-title').fill('Reorder Tabs')
      await saveDocAndAssert(page)
    })

    test('collection — should show api as first tab', async () => {
      const tabs = page.locator('.doc-tabs__tabs-container .doc-tab')
      const firstTab = tabs.first()
      await expect(firstTab).toContainText('API')
    })

    test('collection — should show edit as third tab', async () => {
      const tabs = page.locator('.doc-tabs__tabs-container .doc-tab')
      const secondTab = tabs.nth(2)
      await expect(secondTab).toContainText('Edit')
    })
  })

  describe('custom editMenuItem components', () => {
    test('should render custom editMenuItems client component', async () => {
      await page.goto(editMenuItemsURL.create)
      await page.locator('#field-title')?.fill(title)
      await saveDocAndAssert(page)

      const threeDotMenu = page.getByRole('main').locator('.doc-controls__popup')
      await expect(threeDotMenu).toBeVisible()
      await threeDotMenu.click()

      const customEditMenuItem = page.locator('.popup__content .popup-button-list__button', {
        hasText: 'Custom Edit Menu Item',
      })

      await expect(customEditMenuItem).toBeVisible()
    })

    test('should render custom editMenuItems server component', async () => {
      await page.goto(editMenuItemsURL.create)
      await page.locator('#field-title')?.fill(title)
      await saveDocAndAssert(page)

      const threeDotMenu = page.getByRole('main').locator('.doc-controls__popup')
      await expect(threeDotMenu).toBeVisible()
      await threeDotMenu.click()

      const popup = page.locator('.popup__content')
      await expect(popup).toBeVisible()

      const customEditMenuItem = popup.getByRole('link', {
        name: 'Custom Edit Menu Item (Server)',
      })

      await expect(customEditMenuItem).toBeVisible()
    })

    test('should render doc id in href of custom editMenuItems server component link', async () => {
      await page.goto(editMenuItemsURL.create)
      await page.locator('#field-title')?.fill(title)
      await saveDocAndAssert(page)

      const threeDotMenu = page.getByRole('main').locator('.doc-controls__popup')
      await expect(threeDotMenu).toBeVisible()
      await threeDotMenu.click()

      const popup = page.locator('.popup__content')
      await expect(popup).toBeVisible()

      const customEditMenuItem = popup.getByRole('link', {
        name: 'Custom Edit Menu Item (Server)',
      })

      await expect(customEditMenuItem).toBeVisible()

      // Extract the document id from the edit page URL (last path segment)
      const editPath = new URL(page.url()).pathname
      const docId = editPath.split('/').filter(Boolean).pop()!

      // Assert the href contains the same id
      await expect(customEditMenuItem).toHaveAttribute('href', `/custom-action?id=${docId}`)
    })
  })

  describe('save before leaving modal', () => {
    test('should prompt in drawer with edits', async () => {
      await page.goto(postsUrl.create)
      await page.locator('#field-title').fill('sean')
      await saveDocAndAssert(page)

      await page.goto(postsUrl.create)
      await page.locator('#field-title').fill('heros')
      await selectInput({
        multiSelect: false,
        option: 'sean',
        filter: 'sean',
        selectLocator: page.locator('#field-relationship'),
        selectType: 'relationship',
      })
      await saveDocAndAssert(page)
      await openDocDrawer({
        page,
        selector: '#field-relationship button.relationship--single-value__drawer-toggler',
      })
      const editModal = page.locator('.drawer--is-open .collection-edit')
      await editModal.locator('#field-title').fill('new sean')

      // Attempt to close the drawer
      const closeButton = editModal.locator('button.doc-drawer__header-close')
      await closeButton.click()

      const leaveModal = page.locator('#leave-without-saving-doc-drawer')
      await expect(leaveModal).toBeVisible()
      await leaveModal.locator('#confirm-cancel').click()
      await expect(editModal).toBeVisible()
      await closeButton.click()
      await leaveModal.locator('#confirm-action').click()
      await expect(editModal).toBeHidden()
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
