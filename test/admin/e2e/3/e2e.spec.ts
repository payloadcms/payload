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
  openNav,
  saveDocAndAssert,
  saveDocHotkeyAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { customAdminRoutes } from '../../shared.js'
import {
  customIdCollectionId,
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
import { openDocControls } from 'helpers/e2e/openDocControls.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'

import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

describe('admin3', () => {
  let page: Page
  let geoUrl: AdminUrlUtil
  let postsUrl: AdminUrlUtil
  let globalURL: AdminUrlUtil
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
    geoUrl = new AdminUrlUtil(serverURL, geoCollectionSlug)
    postsUrl = new AdminUrlUtil(serverURL, postsCollectionSlug)
    globalURL = new AdminUrlUtil(serverURL, globalSlug)
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
      await Promise.all([createPost(postData)])
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
