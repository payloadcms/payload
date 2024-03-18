import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Page as PayloadPage } from './payload-types.js'

import payload from '../../packages/payload/src/index.js'
import { initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2E } from '../helpers/initPayloadE2E.js'
import config from './config.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test
let url: AdminUrlUtil
let page: Page
let draftParentId: string
let parentId: string
let draftChildId: string
let childId: string

type Args = {
  parent?: string
  slug: string
  status?: 'draft' | 'published'
  title?: string
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
      title,
      slug,
      _status: status,
      parent,
    },
  }) as unknown as Promise<PayloadPage>
}

describe('Nested Docs Plugin', () => {
  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E({ config, dirname })
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

    test('Parent slug updates breadcrumbs in child', async () => {
      await page.goto(url.edit(childId))
      let slug = page.locator(slugClass).nth(0)
      await expect(slug).toHaveValue('child-slug')

      const parentSlugInChildClass = '#field-breadcrumbs__0__url'

      const parentSlugInChild = page.locator(parentSlugInChildClass).nth(0)
      await expect(parentSlugInChild).toHaveValue('/parent-slug')

      await page.goto(url.edit(parentId))

      slug = page.locator(slugClass).nth(0)
      await slug.fill('updated-parent-slug')
      await expect(slug).toHaveValue('updated-parent-slug')
      await page.locator(publishButtonClass).nth(0).click()

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

      await page.locator(slugClass).nth(0).fill('parent-updated-draft')
      await page.locator(draftButtonClass).nth(0).click()

      await page.waitForTimeout(1500)

      await page.goto(url.edit(draftChildId))
      await expect(parentSlugInChild).toHaveValue('/parent-slug-draft')
    })
  })
})
