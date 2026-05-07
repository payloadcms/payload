import type { BrowserContext, Page } from '@playwright/test'
import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../__helpers/e2e/helpers.js'
import { openDocControls } from '../__helpers/e2e/openDocControls.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { articlesSlug, simpleNoTemplatesSlug, templatesCollectionSlug } from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Templates API — UI flows', () => {
  let page: Page
  let context: BrowserContext
  let payload: PayloadTestSDK<Config>
  let articlesUrl: AdminUrlUtil
  let simpleUrl: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const initialized = await initPayloadE2ENoConfig({ dirname })
    payload = initialized.payload
    articlesUrl = new AdminUrlUtil(initialized.serverURL, articlesSlug)
    simpleUrl = new AdminUrlUtil(initialized.serverURL, simpleNoTemplatesSlug)

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL: initialized.serverURL })
  })

  test.afterAll(async () => {
    await context?.close()
  })

  test.afterEach(async () => {
    await payload
      .delete({
        collection: templatesCollectionSlug,
        where: { id: { exists: true } },
      })
      .catch(() => undefined)

    await payload
      .delete({
        collection: articlesSlug,
        where: { slug: { not_equals: 'seed-article' } },
      })
      .catch(() => undefined)
  })

  test('opens the Save as Template modal from the doc dot menu and persists the template', async () => {
    const seed = await payload.find({
      collection: articlesSlug,
      limit: 1,
      where: { slug: { equals: 'seed-article' } },
    })
    expect(seed.docs.length).toBe(1)

    await page.goto(articlesUrl.edit(seed.docs[0].id as string))
    await page.waitForLoadState('networkidle')

    await openDocControls(page)
    await page.locator('#action-save-as-template').click()

    const modal = page.locator('.save-as-template')
    await expect(modal).toBeVisible()

    await modal.locator('input[name="title"]').fill('My Article Template')
    await page.locator('#save-as-template-confirm').click()

    await expect(modal).toBeHidden({ timeout: 10_000 })

    const templates = await payload.find({
      collection: templatesCollectionSlug,
      where: { title: { equals: 'My Article Template' } },
    })
    expect(templates.docs.length).toBe(1)
    expect(templates.docs[0].entityType).toBe('collection')
    expect(templates.docs[0].entitySlug).toBe(articlesSlug)
    expect((templates.docs[0] as unknown as { schemaHash: string }).schemaHash).toMatch(/^sha256:/)
  })

  test('shows Create from Template button on an opted-in collection list view', async () => {
    await payload.create({
      collection: templatesCollectionSlug,
      data: {
        title: 'Visible Template',
        entityType: 'collection',
        entitySlug: articlesSlug,
        data: { excerpt: 'Picker fixture' },
      },
    })

    await page.goto(articlesUrl.list)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('#action-create-from-template')).toBeVisible()
  })

  test('hides Create from Template button on a non-opted-in collection list view', async () => {
    await page.goto(simpleUrl.list)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('#action-create-from-template')).toHaveCount(0)
  })

  test('picks a template from the modal and creates a doc seeded with template data', async () => {
    const template = await payload.create({
      collection: templatesCollectionSlug,
      data: {
        title: 'Hero Template',
        entityType: 'collection',
        entitySlug: articlesSlug,
        data: {
          title: 'Untitled Article From Template',
          slug: `tpl-${Date.now()}`,
          excerpt: 'Excerpt from template',
        },
      },
    })

    await page.goto(articlesUrl.list)
    await page.waitForLoadState('networkidle')

    await page.locator('#action-create-from-template').click()
    const modal = page.locator('.list-create-from-template')
    await expect(modal).toBeVisible()

    await page.locator(`button[data-template-id="${String(template.id)}"]`).click()

    await page.waitForURL(new RegExp(`/admin/collections/${articlesSlug}/[^/]+$`), {
      timeout: 10_000,
    })

    const articleIDInUrl = page.url().split('/').pop()
    expect(articleIDInUrl).toBeTruthy()

    const articles = await payload.find({
      collection: articlesSlug,
      where: { id: { equals: articleIDInUrl } },
    })
    expect(articles.docs.length).toBe(1)
    expect((articles.docs[0] as unknown as { excerpt: string }).excerpt).toBe(
      'Excerpt from template',
    )
  })

  test('shows an empty state in the picker when no templates exist for the collection', async () => {
    await page.goto(articlesUrl.list)
    await page.waitForLoadState('networkidle')

    await page.locator('#action-create-from-template').click()
    const modal = page.locator('.list-create-from-template')
    await expect(modal).toBeVisible()

    await expect(modal.locator('.list-create-from-template__empty')).toBeVisible()
  })

  test('two consecutive applies of the same template produce documents with distinct slugs', async () => {
    const template = await payload.create({
      collection: templatesCollectionSlug,
      data: {
        title: 'Reusable Template',
        entityType: 'collection',
        entitySlug: articlesSlug,
        data: {
          title: 'Reusable Recipe',
          slug: 'reusable-recipe',
          generateSlug: true,
          excerpt: 'Shared excerpt',
        },
      },
    })

    const applyOnce = async () => {
      await page.goto(articlesUrl.list)
      await page.waitForLoadState('networkidle')

      await page.locator('#action-create-from-template').click()
      await expect(page.locator('.list-create-from-template')).toBeVisible()

      await page.locator(`button[data-template-id="${String(template.id)}"]`).click()

      await page.waitForURL(new RegExp(`/admin/collections/${articlesSlug}/[^/]+$`), {
        timeout: 10_000,
      })

      const id = page.url().split('/').pop()
      return id
    }

    const firstID = await applyOnce()
    const secondID = await applyOnce()

    expect(firstID).toBeTruthy()
    expect(secondID).toBeTruthy()
    expect(firstID).not.toBe(secondID)

    const articles = await payload.find({
      collection: articlesSlug,
      where: {
        id: {
          in: [firstID as string, secondID as string],
        },
      },
    })

    expect(articles.docs.length).toBe(2)
    const slugs = articles.docs.map((doc) => (doc as unknown as { slug: string }).slug)
    expect(new Set(slugs).size).toBe(2)
  })

  test('saves a single block as a tier-2 template via the row dot menu', async () => {
    const seed = await payload.find({
      collection: articlesSlug,
      limit: 1,
      where: { slug: { equals: 'seed-article' } },
    })
    const articleID = seed.docs[0]!.id as string

    // Add a Hero block to the article so we have a row to save
    await payload.update({
      collection: articlesSlug,
      id: articleID,
      data: {
        layout: [{ blockType: 'hero-block', title: 'Tier 2 source' }],
      },
    })

    await page.goto(articlesUrl.edit(articleID))
    await page.waitForLoadState('networkidle')

    // Open the dot menu on the first block row
    const rowMenuButton = page.locator('.array-actions__button').first()
    await rowMenuButton.click()

    await page.locator('.array-actions__save-as-template').click()

    const modal = page.locator('.save-template-prompt[open] form')
    await expect(modal).toBeVisible()
    await modal.locator('input[name="title"]').fill('Hero Tier 2')
    await modal.locator('button[type="submit"]').click()
    await expect(page.locator('.save-template-prompt[open]')).toHaveCount(0, { timeout: 10_000 })

    const templates = await payload.find({
      collection: templatesCollectionSlug,
      where: { title: { equals: 'Hero Tier 2' } },
    })
    expect(templates.docs.length).toBe(1)
    expect(templates.docs[0]!.entityType).toBe('block')
    expect(templates.docs[0]!.entitySlug).toBe('hero-block')
  })

  test('inserts a block template into a layout field via the row dot menu', async () => {
    await payload.create({
      collection: templatesCollectionSlug,
      data: {
        title: 'Insertable Hero',
        entityType: 'block',
        entitySlug: 'hero-block',
        data: { blockType: 'hero-block', title: 'Inserted from template' },
      },
    })

    const seed = await payload.find({
      collection: articlesSlug,
      limit: 1,
      where: { slug: { equals: 'seed-article' } },
    })
    const articleID = seed.docs[0]!.id as string

    // Reset layout so we have a known starting state with one block to anchor on
    await payload.update({
      collection: articlesSlug,
      id: articleID,
      data: {
        layout: [{ blockType: 'hero-block', title: 'Existing' }],
      },
    })

    await page.goto(articlesUrl.edit(articleID))
    await page.waitForLoadState('networkidle')

    const rowMenuButton = page.locator('.array-actions__button').first()
    await rowMenuButton.click()
    await page.locator('.array-actions__insert-from-template').click()

    const drawer = page.locator('.block-template-drawer')
    await expect(drawer).toBeVisible()
    await drawer.locator('button[data-template-id]').first().click()

    // Wait for the second row to be present (DOM lookups can lag form-state writes)
    await expect(page.locator('[id^="field-layout"] .blocks-field__row')).toHaveCount(2, {
      timeout: 10_000,
    })
  })

  test('saves a blocks field as a tier-3 template via the field header', async () => {
    const seed = await payload.find({
      collection: articlesSlug,
      limit: 1,
      where: { slug: { equals: 'seed-article' } },
    })
    const articleID = seed.docs[0]!.id as string

    await payload.update({
      collection: articlesSlug,
      id: articleID,
      data: {
        layout: [
          { blockType: 'hero-block', title: 'Tier 3 first' },
          { blockType: 'cta-block', heading: 'Tier 3 cta', buttonText: 'Click', buttonUrl: '/' },
        ],
      },
    })

    await page.goto(articlesUrl.edit(articleID))
    await page.waitForLoadState('networkidle')

    await page.locator('#field-layout-save-as-template').click()

    const modal = page.locator('.save-template-prompt[open] form')
    await expect(modal).toBeVisible()
    await modal.locator('input[name="title"]').fill('Layout Pack')
    await modal.locator('button[type="submit"]').click()
    await expect(page.locator('.save-template-prompt[open]')).toHaveCount(0, { timeout: 10_000 })

    const templates = await payload.find({
      collection: templatesCollectionSlug,
      where: { title: { equals: 'Layout Pack' } },
    })
    expect(templates.docs.length).toBe(1)
    expect(templates.docs[0]!.entityType).toBe('field')
    expect(templates.docs[0]!.entitySlug).toBe(`${articlesSlug}.layout`)
    expect(Array.isArray(templates.docs[0]!.data)).toBe(true)
  })

  test('replaces a blocks field value with a tier-3 template via the field header', async () => {
    await payload.create({
      collection: templatesCollectionSlug,
      data: {
        title: 'Replacement Layout',
        entityType: 'field',
        entitySlug: `${articlesSlug}.layout`,
        data: [
          { blockType: 'hero-block', title: 'Replaced 1' },
          { blockType: 'hero-block', title: 'Replaced 2' },
          { blockType: 'cta-block', heading: 'Replaced CTA', buttonText: 'Go', buttonUrl: '/' },
        ],
      },
    })

    const seed = await payload.find({
      collection: articlesSlug,
      limit: 1,
      where: { slug: { equals: 'seed-article' } },
    })
    const articleID = seed.docs[0]!.id as string

    await payload.update({
      collection: articlesSlug,
      id: articleID,
      data: {
        layout: [{ blockType: 'hero-block', title: 'Will be replaced' }],
      },
    })

    await page.goto(articlesUrl.edit(articleID))
    await page.waitForLoadState('networkidle')

    await page.locator('#field-layout-replace-from-template').click()
    const drawer = page.locator('.field-template-actions__drawer[open]')
    await expect(drawer).toBeVisible()
    await drawer.locator('button[data-template-id]').first().click()

    await expect(page.locator('[id^="field-layout"] .blocks-field__row')).toHaveCount(3, {
      timeout: 10_000,
    })
  })
})
