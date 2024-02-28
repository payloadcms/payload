import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import type { Page as PayloadPage } from './payload-types'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import payload from '../../packages/payload/src'
import { initPageConsoleErrorCatch } from '../helpers'

const { beforeAll, describe } = test
let url: AdminUrlUtil
let page: Page
let draftParentId: string
let parentId: string
let draftChildId: string
let childId: string

type Args = {
  slug: string
  title?: string
  parent?: string
  status?: 'published' | 'draft'
}

async function createPage({
  slug,
  title = 'Title page',
  parent,
  status = 'published',
}: Args): Promise<PayloadPage> {
  return payload.create({
    collection: 'pages',
    data: {
      title: title,
      slug: slug,
      _status: status,
      parent,
    },
  }) as unknown as Promise<PayloadPage>
}

describe('Nested Docs Plugin', () => {
  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E(__dirname)
    url = new AdminUrlUtil(serverURL, 'pages')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    const parentPage = await createPage({ slug: 'parent-slug' })
    parentId = parentPage.id

    const childPage = await createPage({
      slug: 'child-slug',
      title: 'Child page',
      parent: parentId,
    })
    childId = childPage.id

    const draftParentPage = await createPage({ slug: 'parent-slug-draft', status: 'draft' })
    draftParentId = draftParentPage.id

    const draftChildPage = await createPage({
      slug: 'child-slug-draft',
      title: 'Child page',
      parent: draftParentId,
      status: 'draft',
    })
    draftChildId = draftChildPage.id
  })

  describe('Core functionality', () => {
    const slugClass = '#field-slug'
    const publishButtonClass = '#action-save'
    const draftButtonClass = '#action-save-draft'
    const statusClass = '.status__value-wrap'

    test('Parent slug updates breadcrumbs in child', async () => {
      await page.goto(url.edit(childId))
      let slug = page.locator(slugClass).nth(0)
      await expect(slug).toHaveValue('child-slug')

      const parentSlugInChildClass = '#field-breadcrumbs__0__url'

      const parentSlugInChild = page.locator(parentSlugInChildClass).nth(0)
      await expect(parentSlugInChild).toHaveValue('/parent-slug')

      await page.goto(url.edit(parentId))

      slug = page.locator(slugClass).nth(0)
      slug.fill('updated-parent-slug')
      await expect(slug).toHaveValue('updated-parent-slug')
      page.locator(publishButtonClass).nth(0).click()

      await page.waitForTimeout(1500)

      await page.goto(url.edit(childId))
      await expect(parentSlugInChild).toHaveValue('/updated-parent-slug')
    })

    test('Draft parent slug does not update child', async () => {
      await page.goto(url.edit(draftChildId))

      const parentSlugInChildClass = '#field-breadcrumbs__0__url'

      const parentSlugInChild = page.locator(parentSlugInChildClass).nth(0)
      await expect(parentSlugInChild).toHaveValue('/parent-slug-draft')

      await page.goto(url.edit(parentId))

      page.locator(slugClass).nth(0).fill('parent-updated-draft')
      page.locator(draftButtonClass).nth(0).click()

      await page.waitForTimeout(1500)

      await page.goto(url.edit(draftChildId))
      await expect(parentSlugInChild).toHaveValue('/parent-slug-draft')
    })
  })
})
