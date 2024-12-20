import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Config, Page as PayloadPage } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test
let url: AdminUrlUtil
let page: Page
let draftParentID: string
let parentID: string
let draftChildID: string
let childID: string

describe('Nested Docs Plugin', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { serverURL, payload } = await initPayloadE2ENoConfig<Config>({ dirname })
    url = new AdminUrlUtil(serverURL, 'pages')
    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })

    async function createPage({
      slug,
      title = 'Title page',
      parent,
      _status = 'published',
    }: Partial<PayloadPage>): Promise<PayloadPage> {
      return payload.create({
        collection: 'pages',
        data: {
          title,
          slug,
          _status,
          parent,
        },
      }) as unknown as Promise<PayloadPage>
    }

    const parentPage = await createPage({ slug: 'parent-slug' })
    parentID = parentPage.id

    const childPage = await createPage({
      slug: 'child-slug',
      title: 'Child page',
      parent: parentID,
    })
    childID = childPage.id

    const draftParentPage = await createPage({ slug: 'parent-slug-draft', _status: 'draft' })
    draftParentID = draftParentPage.id

    const draftChildPage = await createPage({
      slug: 'child-slug-draft',
      title: 'Child page',
      parent: draftParentID,
      _status: 'draft',
    })
    draftChildID = draftChildPage.id
  })

  describe('Core functionality', () => {
    const slugClass = '#field-slug'
    const publishButtonClass = '#action-save'
    const draftButtonClass = '#action-save-draft'

    test('Parent slug updates breadcrumbs in child', async () => {
      await page.goto(url.edit(childID))
      let slug = page.locator(slugClass).nth(0)
      await expect(slug).toHaveValue('child-slug')

      // TODO: remove when error states are fixed
      const apiTabButton = page.locator('text=API')
      await apiTabButton.click()
      const breadcrumbs = page.locator('text=/parent-slug').first()
      await expect(breadcrumbs).toBeVisible()

      // TODO: add back once error states are fixed
      // const parentSlugInChildClass = '#field-breadcrumbs__0__url'
      // const parentSlugInChild = page.locator(parentSlugInChildClass).nth(0)
      // await expect(parentSlugInChild).toHaveValue('/parent-slug')

      await page.goto(url.edit(parentID))
      slug = page.locator(slugClass).nth(0)
      await slug.fill('updated-parent-slug')
      await expect(slug).toHaveValue('updated-parent-slug')
      await page.locator(publishButtonClass).nth(0).click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      await page.goto(url.edit(childID))

      // TODO: remove when error states are fixed
      await apiTabButton.click()
      const updatedBreadcrumbs = page.locator('text=/updated-parent-slug').first()
      await expect(updatedBreadcrumbs).toBeVisible()

      // TODO: add back once error states are fixed
      // await expect(parentSlugInChild).toHaveValue('/updated-parent-slug')
    })

    test('Draft parent slug does not update child', async () => {
      await page.goto(url.edit(draftChildID))

      // TODO: remove when error states are fixed
      const apiTabButton = page.locator('text=API')
      await apiTabButton.click()
      const breadcrumbs = page.locator('text=/parent-slug-draft').first()
      await expect(breadcrumbs).toBeVisible()

      // TODO: add back once error states are fixed
      // const parentSlugInChildClass = '#field-breadcrumbs__0__url'
      // const parentSlugInChild = page.locator(parentSlugInChildClass).nth(0)
      // await expect(parentSlugInChild).toHaveValue('/parent-slug-draft')

      await page.goto(url.edit(parentID))
      await page.locator(slugClass).nth(0).fill('parent-updated-draft')
      await page.locator(draftButtonClass).nth(0).click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      await page.goto(url.edit(draftChildID))

      await apiTabButton.click()
      const updatedBreadcrumbs = page.locator('text=/parent-slug-draft').first()
      await expect(updatedBreadcrumbs).toBeVisible()

      // TODO: add back when error states are fixed
      // await expect(parentSlugInChild).toHaveValue('/parent-slug-draft')
    })

    test('Publishing parent doc should not publish child', async () => {
      await page.goto(url.edit(childID))
      await page.locator(slugClass).nth(0).fill('child-updated-draft')
      await page.locator(draftButtonClass).nth(0).click()

      await page.goto(url.edit(parentID))
      await page.locator(slugClass).nth(0).fill('parent-updated-published')
      await page.locator(publishButtonClass).nth(0).click()

      await page.goto(url.edit(childID))
      await expect(page.locator(slugClass).nth(0)).toHaveValue('child-updated-draft')
    })
  })
})
