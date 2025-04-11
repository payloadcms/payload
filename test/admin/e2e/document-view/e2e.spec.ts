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
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import {
  customAdminRoutes,
  customEditLabel,
  customNestedTabViewPath,
  customNestedTabViewTitle,
  customTabAdminDescription,
  customTabLabel,
  customTabViewPath,
  customTabViewTitle,
} from '../../shared.js'
import {
  customFieldsSlug,
  customGlobalViews2GlobalSlug,
  customViews2CollectionSlug,
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
import { openNav } from 'helpers/e2e/toggleNav.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'

import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
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
  let customFieldsURL: AdminUrlUtil

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

  describe('preview button', () => {
    test('collection — should render preview button when `admin.preview` is set', async () => {
      const collectionWithPreview = new AdminUrlUtil(serverURL, postsCollectionSlug)
      await page.goto(collectionWithPreview.create)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('.btn.preview-btn')).toBeVisible()
    })

    test('collection — should not render preview button when `admin.preview` is not set', async () => {
      const collectionWithoutPreview = new AdminUrlUtil(serverURL, group1Collection1Slug)
      await page.goto(collectionWithoutPreview.create)
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

  describe('drawers', () => {
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
      const drawerLeft = await drawer1Content.boundingBox().then((box) => box.x)
      await drawer1Content
        .locator('.field-type.relationship .relationship--single-value__drawer-toggler')
        .click()
      const drawer2Content = page.locator('[id^=doc-drawer_posts_2_] .drawer__content')
      await expect(drawer2Content).toBeVisible()
      const drawer2Left = await drawer2Content.boundingBox().then((box) => box.x)
      expect(drawer2Left > drawerLeft).toBe(true)
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
    })
  })

  describe('publish button', () => {
    test('should show publish active locale button with defaultLocalePublishOption', async () => {
      await navigateToDoc(page, postsUrl)
      const publishButton = page.locator('#action-save')
      await expect(publishButton).toBeVisible()
      await expect(publishButton).toContainText('Publish in English')
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
