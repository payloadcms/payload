import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { login } from '../__helpers/e2e/auth/login.js'
import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { devUser } from '../credentials.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { draftPostsSlug, postsSlug, usersSlug } from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type AuthUser = { collection: string; id: number | string } & Record<string, unknown>

// A second user (created in the config's onInit) who can only read their own record.
const otherUserEmail = 'other@payloadcms.com'
const otherUserPassword = devUser.password

test.describe('Authorship', () => {
  let page: Page
  let serverURL: string
  let payload: PayloadTestSDK<Config>
  let devUserAuth: AuthUser

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const devUserDoc = (
      await payload.find({
        collection: usersSlug,
        depth: 0,
        limit: 1,
        where: { email: { equals: devUser.email } },
      })
    ).docs[0]!
    devUserAuth = { ...devUserDoc, collection: usersSlug }

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ noAutoLogin: true, page, serverURL })
    await login({ page, serverURL })
  })

  test('renders createdBy and updatedBy labels in the version compare view', async () => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'version one' },
      depth: 0,
    })

    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { title: 'version two' },
      depth: 0,
      draft: true,
    })

    const versions = await payload.findVersions({
      collection: draftPostsSlug,
      depth: 0,
      limit: 1,
      where: {
        parent: { equals: doc.id },
      },
    })

    const versionID = versions.docs[0]?.id

    // `modifiedOnly=false` forces every field to render, so the authorship fields
    // are shown regardless of whether their value changed between versions.
    await page.goto(
      `${serverURL}/admin/collections/${draftPostsSlug}/${doc.id}/versions/${versionID}?modifiedOnly=false`,
    )

    await expect(page.locator('.render-field-diffs').first()).toBeVisible()

    await expect(page.locator('.field-diff-label', { hasText: 'Created By' }).first()).toBeVisible()
    await expect(page.locator('.field-diff-label', { hasText: 'Updated By' }).first()).toBeVisible()
  })

  test('exposes createdBy and updatedBy in the API view JSON', async () => {
    const url = new AdminUrlUtil(serverURL, postsSlug)

    // Create the document through the UI so the authorship fields are populated
    // from the logged-in user rather than being null.
    await page.goto(url.create)
    await page.locator('#field-title').fill('api tab post')
    await saveDocAndAssert(page)

    await page.getByRole('link', { name: 'API' }).click()

    const results = page.locator('.query-inspector__results')
    await expect(results).toBeVisible()
    await expect(results).toContainText('createdBy')
    await expect(results).toContainText('updatedBy')
  })

  test('shows createdBy as an id in the API view for a reader without access to the user', async ({
    browser,
  }) => {
    // Author the post as devUser, whom the restricted reader cannot read.
    const post = await payload.create({
      collection: postsSlug,
      data: {
        createdBy: { relationTo: usersSlug, value: devUserAuth.id as string },
        title: 'restricted api view',
      },
      depth: 0,
    })

    const restrictedContext = await browser.newContext()
    const restrictedPage = await restrictedContext.newPage()
    initPageConsoleErrorCatch(restrictedPage)
    await login({
      data: { email: otherUserEmail, password: otherUserPassword },
      page: restrictedPage,
      serverURL,
    })

    const url = new AdminUrlUtil(serverURL, postsSlug)
    await restrictedPage.goto(url.edit(post.id))
    await restrictedPage.getByRole('link', { name: 'API' }).click()

    const results = restrictedPage.locator('.query-inspector__results')
    await expect(results).toBeVisible()
    // createdBy is rendered as an id reference — present, but the creator's email must not leak.
    await expect(results).toContainText('createdBy')
    await expect(results).not.toContainText(devUser.email)

    await restrictedContext.close()
  })

  test('shows createdBy as an id in the version compare view for a reader without access to the user', async ({
    browser,
  }) => {
    // Author the versioned doc as devUser, whom the restricted reader cannot read.
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: {
        createdBy: { relationTo: usersSlug, value: devUserAuth.id as string },
        title: 'restricted version one',
      },
      depth: 0,
    })

    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { title: 'restricted version two' },
      depth: 0,
      draft: true,
    })

    const versions = await payload.findVersions({
      collection: draftPostsSlug,
      depth: 0,
      limit: 1,
      where: { parent: { equals: doc.id } },
    })
    const versionID = versions.docs[0]?.id

    const restrictedContext = await browser.newContext()
    const restrictedPage = await restrictedContext.newPage()
    initPageConsoleErrorCatch(restrictedPage)
    await login({
      data: { email: otherUserEmail, password: otherUserPassword },
      page: restrictedPage,
      serverURL,
    })

    await restrictedPage.goto(
      `${serverURL}/admin/collections/${draftPostsSlug}/${doc.id}/versions/${versionID}?modifiedOnly=false`,
    )

    const diffs = restrictedPage.locator('.render-field-diffs').first()
    await expect(diffs).toBeVisible()
    await expect(
      restrictedPage.locator('.field-diff-label', { hasText: 'Created By' }).first(),
    ).toBeVisible()
    // createdBy renders as an id reference — the id is shown, but the creator's email must not leak.
    await expect(diffs).toContainText(String(devUserAuth.id))
    await expect(diffs).not.toContainText(devUser.email)

    await restrictedContext.close()
  })
})
