import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { gotoAndWaitForForm } from '../__helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { devUser } from '../credentials.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { branchesSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

let payload: PayloadTestSDK<Config>
let serverURL: string
let branch: Config['collections'][typeof branchesSlug]
let editorID: string | undefined

async function openDeletion({
  activeBranch = branch.slug,
  page,
}: {
  activeBranch?: string
  page: Page
}) {
  await gotoAndWaitForForm(
    page,
    `${serverURL}/admin/collections/${branchesSlug}/${branch.id}/manage?branch=${activeBranch}`,
  )
  await page.getByRole('button', { name: 'More options: Document', exact: true }).click()
  await page.locator('#action-delete').click()
}

test.describe('Deleting the selected branch', () => {
  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    editorID = undefined
    branch = await payload.create({
      collection: branchesSlug,
      data: {
        name: 'Selected branch deletion',
        slug: `selected-deletion-${testInfo.testId}`,
        status: 'open',
      },
      overrideAccess: true,
    })
    await initPage({ page, serverURL })
  })

  test.afterEach(async () => {
    await payload.delete({
      collection: branchesSlug,
      overrideAccess: true,
      where: { id: { equals: branch.id } },
    })

    if (editorID) {
      await payload.delete({
        collection: 'payload-preferences',
        overrideAccess: true,
        where: { 'user.value': { equals: editorID } },
      })
      await payload.delete({ collection: 'users', id: editorID, overrideAccess: true })
    }
  })

  test('should return to the branch list on main after deleting the selected branch', async ({
    page,
  }) => {
    await openDeletion({ page })

    const deleted = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === `/api/${branchesSlug}/${branch.id}` &&
        response.request().method() === 'DELETE',
    )

    await page.locator('.delete-document [data-dialog-action="confirm"]').press('Enter')
    await expect.poll(async () => (await deleted).status()).toBe(200)
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === `/admin/collections/${branchesSlug}` &&
        (!url.searchParams.has('branch') || url.searchParams.get('branch') === 'main'),
    )
    await expect(page.locator('.branch-selector__trigger-name')).toHaveText('main')
    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'successfully deleted',
    )
    await expect(page.getByRole('heading', { name: 'Branches', exact: true })).toBeVisible()
    await expect
      .poll(
        async () =>
          (await payload.find({ collection: branchesSlug, where: { id: { equals: branch.id } } }))
            .totalDocs,
      )
      .toBe(0)
  })

  test('should preserve the selected branch when deleting another branch', async ({ page }) => {
    const retainedBranch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Keep this branch selected', slug: `retained-${branch.slug}`, status: 'open' },
      overrideAccess: true,
    })

    try {
      await openDeletion({ activeBranch: retainedBranch.slug, page })

      const deleted = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === `/api/${branchesSlug}/${branch.id}` &&
          response.request().method() === 'DELETE',
      )

      await page.locator('.delete-document [data-dialog-action="confirm"]').press('Enter')
      await expect.poll(async () => (await deleted).status()).toBe(200)
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === `/admin/collections/${branchesSlug}` &&
          url.searchParams.get('branch') === retainedBranch.slug,
      )
      await expect(page.locator('.branch-selector__trigger-name')).toHaveText(retainedBranch.name)
      await expect(page.getByRole('heading', { name: 'Branches', exact: true })).toBeVisible()
    } finally {
      await payload.delete({
        collection: branchesSlug,
        id: retainedBranch.id,
        overrideAccess: true,
      })
    }
  })

  test('should toast a denied deletion and keep the selected branch page usable', async ({
    page,
  }) => {
    await openDeletion({ page })

    const editor = await payload.create({
      collection: 'users',
      data: { email: 'branch-deletion-editor@example.com', password: devUser.password },
      overrideAccess: true,
    })

    editorID = editor.id

    // Change sessions after the confirmation opens so the server must reject stale permissions.
    const login = await page.request.post(`${serverURL}/api/users/login`, {
      data: { email: editor.email, password: devUser.password },
    })

    await expect.poll(() => login.status()).toBe(200)

    const denied = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === `/api/${branchesSlug}/${branch.id}` &&
        response.request().method() === 'DELETE',
    )

    await page.locator('.delete-document [data-dialog-action="confirm"]').press('Enter')
    await expect.poll(async () => (await denied).status()).toBe(403)
    await expect(page.locator('.payload-toast-container .toast-error')).toContainText(
      'You are not allowed to perform this action',
    )
    await expect(page).toHaveURL(
      `${serverURL}/admin/collections/${branchesSlug}/${branch.id}/manage?branch=${branch.slug}`,
    )
    await expect(page.locator('.branch-selector__trigger-name')).toHaveText(branch.name)
    await expect(page.locator('.delete-document')).toBeHidden()
    await page.locator('#field-name:visible').fill('Page still usable')
    await expect(page.locator('#field-name:visible')).toHaveValue('Page still usable')
    await expect
      .poll(
        async () =>
          (await payload.find({ collection: branchesSlug, where: { id: { equals: branch.id } } }))
            .totalDocs,
      )
      .toBe(1)
  })
})
