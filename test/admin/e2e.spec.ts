import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import qs from 'qs'

import type { Geo, Post } from './payload-types'

import payload from '../../packages/payload/src'
import { mapAsync } from '../../packages/payload/src/utilities/mapAsync'
import wait from '../../packages/payload/src/utilities/wait'
import {
  checkBreadcrumb,
  checkPageTitle,
  exactText,
  initPageConsoleErrorCatch,
  openDocControls,
  openNav,
  saveDocAndAssert,
  saveDocHotkeyAndAssert,
} from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { clearAndSeedEverything } from './seed'
import {
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
} from './shared'
import {
  customViews2CollectionSlug,
  geoCollectionSlug,
  globalSlug,
  group1Collection1Slug,
  group1GlobalSlug,
  noApiViewCollectionSlug,
  noApiViewGlobalSlug,
  postsCollectionSlug,
  customIdCollectionSlug,
  customIdCollectionId,
} from './slugs'

const { beforeAll, beforeEach, describe } = test

const title = 'Title'
const description = 'Description'

describe('admin', () => {
  let page: Page
  let geoUrl: AdminUrlUtil
  let url: AdminUrlUtil
  let customViewsURL: AdminUrlUtil
  let serverURL: string

  beforeAll(async ({ browser }) => {
    serverURL = (await initPayloadE2E(__dirname)).serverURL
    geoUrl = new AdminUrlUtil(serverURL, geoCollectionSlug)
    url = new AdminUrlUtil(serverURL, postsCollectionSlug)
    customViewsURL = new AdminUrlUtil(serverURL, customViews2CollectionSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
  })
  beforeEach(async () => {
    await clearAndSeedEverything(payload)
  })

  describe('Nav', () => {
    test('should nav to collection - nav', async () => {
      await page.goto(url.admin)
      await openNav(page)
      await page.locator(`#nav-${postsCollectionSlug}`).click()
      expect(page.url()).toContain(url.list)
    })

    test('should nav to a global - nav', async () => {
      await page.goto(url.admin)
      await openNav(page)
      await page.locator(`#nav-global-${globalSlug}`).click()
      expect(page.url()).toContain(url.global(globalSlug))
    })

    test('should navigate to collection - card', async () => {
      await page.goto(url.admin)
      await wait(200)
      await page.locator(`#card-${postsCollectionSlug}`).click()
      expect(page.url()).toContain(url.list)
    })

    test('should collapse and expand collection groups', async () => {
      await page.goto(url.admin)
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

    test('should collapse and expand globals groups', async () => {
      await page.goto(url.admin)
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

    test('should save nav group collapse preferences', async () => {
      await page.goto(url.admin)
      await openNav(page)
      await page.locator('#nav-group-One .nav-group__toggle').click()
      await page.goto(url.admin)
      const link = page.locator('#nav-group-one-collection-ones')
      await expect(link).toBeHidden()
    })

    test('breadcrumbs - from list to dashboard', async () => {
      await page.goto(url.list)
      await page.locator('.step-nav a[href="/admin"]').click()
      expect(page.url()).toContain(url.admin)
    })

    test('breadcrumbs - from document to collection', async () => {
      const { id } = await createPost()
      await page.goto(url.edit(id))
      const collectionBreadcrumb = page.locator(
        `.step-nav a[href="/admin/collections/${postsCollectionSlug}"]`,
      )
      await expect(collectionBreadcrumb).toBeVisible()
      await expect(collectionBreadcrumb).toHaveText(slugPluralLabel)
      expect(page.url()).toContain(url.list)
    })

    test('should not show hidden collections and globals', async () => {
      await page.goto(url.admin)

      // nav menu
      await expect(page.locator('#nav-hidden-collection')).toBeHidden()
      await expect(page.locator('#nav-hidden-global')).toBeHidden()

      // dashboard
      await expect(page.locator('#card-hidden-collection')).toBeHidden()
      await expect(page.locator('#card-hidden-global')).toBeHidden()

      // routing
      await page.goto(url.collection('hidden-collection'))
      await expect(page.locator('.not-found')).toContainText('Nothing found')
      await page.goto(url.global('hidden-global'))
      await expect(page.locator('.not-found')).toContainText('Nothing found')
    })

    test('should render custom view', async () => {
      await page.goto(`${serverURL}/admin${customViewPath}`)
      const pageURL = page.url()
      const pathname = new URL(pageURL).pathname
      expect(pathname).toEqual(`/admin${customViewPath}`)
      await expect(page.locator('h1#custom-view-title')).toContainText(customViewTitle)
    })

    test('should render custom nested view', async () => {
      await page.goto(`${serverURL}/admin${customNestedViewPath}`)
      const pageURL = page.url()
      const pathname = new URL(pageURL).pathname
      expect(pathname).toEqual(`/admin${customNestedViewPath}`)
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

    test('collection - should render custom nested tab view', async () => {
      await page.goto(customViewsURL.create)
      await page.locator('#field-title').fill('Test')
      await saveDocAndAssert(page)
      const pageURL = page.url()
      const customNestedTabViewURL = `${pageURL}${customNestedTabViewPath}`
      await page.goto(customNestedTabViewURL)
      expect(page.url()).toEqual(customNestedTabViewURL)
      await expect(page.locator('h1#custom-view-title')).toContainText(customNestedTabViewTitle)
    })

    test('collection - should render custom tab label', async () => {
      await page.goto(customViewsURL.create)
      await page.locator('#field-title').fill('Test')
      await saveDocAndAssert(page)
      const docURL = page.url()
      const pathname = new URL(docURL).pathname

      const editTab = page
        .locator('.doc-tab', {
          has: page.locator(`a[href="${pathname}"]`),
        })
        ?.first()

      await expect(editTab).toContainText(customEditLabel)
    })

    test('collection - should render custom tab component', async () => {
      await page.goto(customViewsURL.create)
      await page.locator('#field-title').fill('Test')
      await saveDocAndAssert(page)

      const editTab = page.locator(`.doc-tab`, {
        hasText: exactText(customTabLabel),
      })

      await expect(editTab).toBeVisible()
    })

    test('collection - should not show API tab when disabled in config', async () => {
      await page.goto(url.collection(noApiViewCollectionSlug))
      await page.locator('.collection-list .table a').click()
      await expect(page.locator('.doc-tabs__tabs-container')).not.toContainText('API')
    })

    test('collection - should not enable API route when disabled in config', async () => {
      const collectionItems = await payload.find({
        collection: noApiViewCollectionSlug,
        limit: 1,
      })
      expect(collectionItems.docs.length).toBe(1)
      await page.goto(`${url.collection(noApiViewGlobalSlug)}/${collectionItems.docs[0].id}/api`)
      await expect(page.locator('.not-found')).toHaveCount(1)
    })

    test('collection - sidebar fields should respond to permission', async () => {
      const { id } = await createPost()
      await page.goto(url.edit(id))

      await expect(page.locator('#field-sidebarField')).toBeDisabled()
    })

    test('global - should not show API tab when disabled in config', async () => {
      await page.goto(url.global(noApiViewGlobalSlug))
      await expect(page.locator('.doc-tabs__tabs-container')).not.toContainText('API')
    })

    test('global - should not enable API route when disabled in config', async () => {
      await page.goto(`${url.global(noApiViewGlobalSlug)}/api`)
      await expect(page.locator('.not-found')).toHaveCount(1)
    })
  })

  describe('app-header', () => {
    test('should show admin level action in admin panel', async () => {
      await page.goto(url.admin)
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

  describe('ui', () => {
    test('collection - should render preview button when `admin.preview` is set', async () => {
      const collectionWithPreview = new AdminUrlUtil(serverURL, postsCollectionSlug)
      await page.goto(collectionWithPreview.create)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('.btn.preview-btn')).toBeVisible()
    })

    test('collection - should not render preview button when `admin.preview` is not set', async () => {
      const collectionWithoutPreview = new AdminUrlUtil(serverURL, group1Collection1Slug)
      await page.goto(collectionWithoutPreview.create)
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('.btn.preview-btn')).toBeHidden()
    })

    test('global - should render preview button when `admin.preview` is set', async () => {
      const globalWithPreview = new AdminUrlUtil(serverURL, globalSlug)
      await page.goto(globalWithPreview.global(globalSlug))
      await expect(page.locator('.btn.preview-btn')).toBeVisible()
    })

    test('global - should not render preview button when `admin.preview` is not set', async () => {
      const globalWithoutPreview = new AdminUrlUtil(serverURL, group1GlobalSlug)
      await page.goto(globalWithoutPreview.global(group1GlobalSlug))
      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)
      await expect(page.locator('.btn.preview-btn')).toBeHidden()
    })
  })

  describe('doc titles', () => {
    test('collection - should render fallback titles when creating new', async () => {
      await page.goto(url.create)
      await checkPageTitle(page, '[Untitled]')
      await checkBreadcrumb(page, 'Create New')
      await saveDocAndAssert(page)
      expect(true).toBe(true)
    })

    test('collection - should render `useAsTitle` field', async () => {
      await page.goto(url.create)
      await page.locator('#field-title')?.fill(title)
      await saveDocAndAssert(page)
      await wait(500)
      await checkPageTitle(page, title)
      await checkBreadcrumb(page, title)
      expect(true).toBe(true)
    })

    test('collection - should render `id` as `useAsTitle` fallback', async () => {
      const { id } = await createPost()
      await page.goto(url.edit(id))
      await page.locator('#field-title')?.fill('')
      expect(await page.locator('.doc-header__title.render-title')?.innerText()).toContain('ID:')
      await saveDocAndAssert(page)
    })

    test('global - should render custom, localized label', async () => {
      await openNav(page)
      const label = 'My Global Label'
      const globalLabel = page.locator(`#nav-global-global`)
      await expect(globalLabel).toContainText(label)
      await globalLabel.click()
      await checkPageTitle(page, label)
      await checkBreadcrumb(page, label)
    })

    test('global - should render simple label strings', async () => {
      await openNav(page)
      const label = 'Group Globals 1'
      const globalLabel = page.locator(`#nav-global-group-globals-one`)
      await expect(globalLabel).toContainText(label)
      await globalLabel.click()
      await checkPageTitle(page, label)
      await checkBreadcrumb(page, label)
      await saveDocAndAssert(page)
    })

    test('global - should render slug in sentence case as fallback', async () => {
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
      await page.goto(url.create)
      await page.locator('#field-title').fill(title)
      await page.locator('#field-description').fill(description)
      await saveDocAndAssert(page)
      await expect(page.locator('#field-title')).toHaveValue(title)
      await expect(page.locator('#field-description')).toHaveValue(description)
    })

    test('should read existing', async () => {
      const { id } = await createPost()
      await page.goto(url.edit(id))
      await expect(page.locator('#field-title')).toHaveValue(title)
      await expect(page.locator('#field-description')).toHaveValue(description)
    })

    test('should update existing', async () => {
      const { id } = await createPost()
      await page.goto(url.edit(id))
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
      await page.goto(url.edit(id))
      const newTitle = 'new title'
      await page.locator('#field-title').fill(newTitle)
      await saveDocHotkeyAndAssert(page)
      await expect(page.locator('#field-title')).toHaveValue(newTitle)
    })

    test('should delete existing', async () => {
      const { id, title } = await createPost()
      await page.goto(url.edit(id))
      await openDocControls(page)
      await page.locator('#action-delete').click()
      await page.locator('#confirm-delete').click()
      await expect(page.locator(`text=Post "${title}" successfully deleted.`)).toBeVisible()
      expect(page.url()).toContain(url.list)
    })

    test('should bulk delete', async () => {
      // First, delete all posts created by the seed
      await deleteAllPosts()

      await Promise.all([createPost(), createPost(), createPost()])

      await page.goto(url.list)
      await page.locator('input#select-all').check()
      await page.locator('.delete-documents__toggle').click()
      await page.locator('#confirm-delete').click()
      await expect(page.locator('.Toastify__toast--success')).toHaveText(
        'Deleted 3 Posts successfully.',
      )
      await expect(page.locator('.collection-list__no-results')).toBeVisible()
    })

    test('should bulk update', async () => {
      // First, delete all posts created by the seed
      await deleteAllPosts()

      await Promise.all([createPost(), createPost(), createPost()])

      const bulkTitle = 'Bulk update title'
      await page.goto(url.list)

      await page.locator('input#select-all').check()
      await page.locator('.edit-many__toggle').click()
      await page.locator('.field-select .rs__control').click()

      const titleOption = page.locator('.rs__option', {
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
      await page.goto(url.global(globalSlug))

      await page.locator('#field-title').fill(title)
      await saveDocAndAssert(page)

      await expect(page.locator('#field-title')).toHaveValue(title)
    })
  })

  describe('Custom IDs', () => {
    test('should allow custom ID field nested inside an unnamed tab', async () => {
      await page.goto(url.collection('customIdTab') + '/' + customIdCollectionId)

      const idField = await page.locator('#field-id')

      await expect(idField).toHaveValue(customIdCollectionId)
    })

    test('should allow custom ID field nested inside a row', async () => {
      await page.goto(url.collection('customIdRow') + '/' + customIdCollectionId)

      const idField = await page.locator('#field-id')

      await expect(idField).toHaveValue(customIdCollectionId)
    })
  })

  describe('i18n', () => {
    test('should allow changing language', async () => {
      await page.goto(url.account)

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
      await page.goto(url.account)
      await expect(page.locator('.step-nav a').first().locator('span')).toHaveAttribute(
        'title',
        'Home',
      )
    })

    test('should allow custom translation of locale labels', async () => {
      const selectOptionClass = '.localizer .popup-button-list__button'
      const localizorButton = page.locator('.localizer .popup-button')
      const secondLocale = page.locator(selectOptionClass).nth(1)

      async function checkLocalLabels(firstLabel: string, secondLabel: string) {
        await localizorButton.click()
        await expect(page.locator(selectOptionClass).first()).toContainText(firstLabel)
        await expect(page.locator(selectOptionClass).nth(1)).toContainText(secondLabel)
      }

      await checkLocalLabels('English (en)', 'Spanish (es)')

      // Change locale to Spanish
      await localizorButton.click()
      await expect(secondLocale).toContainText('Spanish (es)')
      await secondLocale.click()

      // Go to account page
      await page.goto(url.account)

      const languageField = page.locator('.payload-settings__language .react-select')
      const options = page.locator('.rs__option')

      // Change language to Spanish
      await languageField.click()
      await options.locator('text=Español').click()

      await checkLocalLabels('Inglés (en)', 'Español (es)')

      // Change locale and language back to English
      await languageField.click()
      await options.locator('text=English').click()
      await localizorButton.click()
      await expect(secondLocale).toContainText('Spanish (es)')
    })
  })

  describe('list view', () => {
    const tableRowLocator = 'table > tbody > tr'

    beforeEach(async () => {
      await page.goto(url.list)
    })

    describe('filtering', () => {
      test('should prefill search input from query param', async () => {
        await createPost({ title: 'dennis' })
        await createPost({ title: 'charlie' })

        // prefill search with "a" from the query param
        await page.goto(`${url.list}?search=dennis`)

        // input should be filled out, list should filter
        await expect(page.locator('.search-filter__input')).toHaveValue('dennis')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)
      })

      test('search by id with listSearchableFields', async () => {
        const { id } = await createPost()
        await page.goto(`${url.list}?limit=10&page=1&search=${id}`)
        const tableItems = page.locator(tableRowLocator)
        await expect(tableItems).toHaveCount(1)
      })

      test('search by id without listSearchableFields', async () => {
        const { id } = await createGeo()
        await page.goto(`${geoUrl.list}?limit=10&page=1&search=${id}`)
        const tableItems = page.locator(tableRowLocator)
        await expect(tableItems).toHaveCount(1)
      })

      test('search by title or description', async () => {
        await createPost({
          description: 'this is fun',
          title: 'find me',
        })

        await page.locator('.search-filter__input').fill('find me')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)

        await page.locator('.search-filter__input').fill('this is fun')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)
      })

      test('toggle columns', async () => {
        // delete all posts created by the seed
        await deleteAllPosts()

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
        await expect(page.locator('.cell-id')).toBeVisible()

        await expect(page.locator(columnCountLocator)).toHaveCount(numberOfColumns)
        await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('ID')
      })

      test('2nd cell is a link', async () => {
        const { id } = await createPost()
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

      test('filter rows', async () => {
        // delete all posts created by the seed
        await deleteAllPosts()

        const { id } = await createPost({ title: 'post1' })
        await createPost({ title: 'post2' })

        // open the column controls
        await page.locator('.list-controls__toggle-columns').click()

        // wait until the column toggle UI is visible and fully expanded
        await expect(page.locator('.column-selector')).toBeVisible()
        await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('ID')

        // ensure the ID column is active
        const idButton = page.locator('.column-selector .column-selector__column', {
          hasText: exactText('ID'),
        })

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
        const valueField = page.locator('.condition__value > input')

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

      test('resets filter value and operator on field update', async () => {
        const { id } = await createPost({ title: 'post1' })
        await createPost({ title: 'post2' })

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
        await createPost({ title: 'post1' })
        await createPost({ title: 'post2' })
        await page.goto(`${url.list}?limit=10&page=1&where[or][0][and][0][title][equals]=post1`)

        await expect(page.locator('.react-select--single-value').first()).toContainText('Title')
        await expect(page.locator(tableRowLocator)).toHaveCount(1)
      })

      test('should accept transformed where query from invalid URL where parameter', async () => {
        await createPost({ title: 'post1' })
        await createPost({ title: 'post2' })
        // [title][equals]=post1 should be getting transformed into a valid where[or][0][and][0][title][equals]=post1
        await page.goto(`${url.list}?limit=10&page=1&where[title][equals]=post1`)

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
              coordinates: [polygon],
              type: 'Polygon',
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
        await page.goto(url.create)

        // Open the drawer
        await page.locator('.rich-text .list-drawer__toggler').click()
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
        await page.goto(url.create)

        // Open the drawer
        await page.locator('.rich-text .list-drawer__toggler').click()
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
        await page.goto(url.list)
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

        await mapAsync([...Array(3)], async () => {
          await createPost()
        })
      })

      test('should select multiple rows', async () => {
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
        const pageInfo = page.locator('.collection-list__page-info')
        const perPage = page.locator('.per-page')
        const paginator = page.locator('.paginator')
        const tableItems = page.locator(tableRowLocator)

        await expect(tableItems).toHaveCount(10)
        await expect(pageInfo).toHaveText('1-10 of 11')
        await expect(perPage).toContainText('Per Page: 10')

        // Forward one page and back using numbers
        await paginator.locator('button').nth(1).click()
        expect(page.url()).toContain('page=2')
        await expect(tableItems).toHaveCount(1)
        await paginator.locator('button').nth(0).click()
        expect(page.url()).toContain('page=1')
        await expect(tableItems).toHaveCount(10)
      })
    })

    describe('custom css', () => {
      test('should see custom css in admin UI', async () => {
        await page.goto(url.admin)
        await openNav(page)
        const navControls = page.locator('#custom-css')
        await expect(navControls).toHaveCSS('font-family', 'monospace')
      })
    })

    // TODO: Troubleshoot flaky suite
    describe('sorting', () => {
      beforeEach(async () => {
        // delete all posts created by the seed
        await deleteAllPosts()

        await Promise.all([
          createPost({
            number: 1,
          }),
          createPost({
            number: 2,
          }),
        ])
      })

      test('should sort', async () => {
        const upChevron = page.locator('#heading-number .sort-column__asc')
        const downChevron = page.locator('#heading-number .sort-column__desc')

        await upChevron.click()
        await expect(page.locator('.row-1 .cell-number')).toHaveText('1')
        await expect(page.locator('.row-2 .cell-number')).toHaveText('2')

        await downChevron.click()
        await expect(page.locator('.row-1 .cell-number')).toHaveText('2')
        await expect(page.locator('.row-2 .cell-number')).toHaveText('1')
      })
    })

    describe('i18n', () => {
      test('should display translated collections and globals config options', async () => {
        await page.goto(url.list)

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
        await page.goto(url.account)
        await page.locator('.payload-settings__language .react-select').click()
        const languageSelect = page.locator('.rs__option')
        // text field does not have a 'de' label
        await languageSelect.locator('text=Deutsch').click()

        await page.goto(url.list)
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

  describe('Field descriptions', () => {
    test('should render static field description', async () => {
      await page.goto(url.create)
      await expect(page.locator('.field-description-descriptionAsString')).toContainText(
        'Static field description.',
      )
    })
    test('should render functional field description', async () => {
      await page.goto(url.create)
      await page.locator('#field-descriptionAsFunction').fill('functional')
      await expect(page.locator('.field-description-descriptionAsFunction')).toContainText(
        'Function description: descriptionAsFunction - functional',
      )
    })
    test('should render component field description', async () => {
      await page.goto(url.create)
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
  const posts = await payload.find({
    collection: postsCollectionSlug,
    limit: 100,
  })
  await Promise.all([
    ...posts.docs.map((post) => {
      return payload.delete({
        collection: postsCollectionSlug,
        id: post.id,
      })
    }),
  ])
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
