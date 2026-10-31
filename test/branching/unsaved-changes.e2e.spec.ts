import { expect, test } from '@playwright/test'
import path from 'path'
import { PREFERENCE_KEYS } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { gotoAndWaitForForm } from '../__helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { branchesSlug, headerGlobalSlug, postsSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

let payload: PayloadTestSDK<Config>
let serverURL: string

test.describe('Branch switching with unsaved changes', () => {
  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  for (const entity of ['collection', 'global'] as const) {
    for (const action of ['select', 'create'] as const) {
      test(`should confirm before ${action} branch switching on a modified ${entity}`, async ({
        page,
      }, testInfo) => {
        testInfo.setTimeout(TEST_TIMEOUT_LONG)

        const branchName = `Unsaved ${entity} ${action} ${Date.now()}`
        const createdBranchIDs: string[] = []
        let postID: string | undefined
        const headerResponse = await page.request.get(
          `${serverURL}/api/globals/${headerGlobalSlug}`,
        )
        const header = (await headerResponse.json()) as Config['globals'][typeof headerGlobalSlug]
        const preferenceWrites: string[] = []

        try {
          const branch = await payload.create({
            collection: branchesSlug,
            overrideAccess: true,
            data: {
              name: branchName,
              slug: branchName.toLowerCase().replaceAll(' ', '-'),
              status: 'open',
            },
          })

          createdBranchIDs.push(branch.id)
          await initPage({ page, serverURL })

          let editURL: string
          let fieldSelector: string

          if (entity === 'collection') {
            const post = await payload.create({
              collection: postsSlug,
              overrideAccess: true,
              data: { title: 'Saved content' },
            })

            postID = post.id
            editURL = `${serverURL}/admin/collections/${postsSlug}/${post.id}`
            fieldSelector = '#field-title'
          } else {
            await payload.updateGlobal({
              slug: headerGlobalSlug,
              overrideAccess: true,
              data: { navLabel: 'Saved content' },
            })
            editURL = `${serverURL}/admin/globals/${headerGlobalSlug}`
            fieldSelector = '#field-navLabel'
          }

          await gotoAndWaitForForm(page, editURL)
          await expect(page.locator('.branch-selector__trigger-name')).toHaveText('main')
          await page.locator(fieldSelector).fill('Unsaved content')
          page.on('request', (request) => {
            if (
              request.method() === 'POST' &&
              request.url().includes(`/payload-preferences/${PREFERENCE_KEYS.NAV}`)
            ) {
              preferenceWrites.push(request.url())
            }
          })

          const chooseBranch = async ({ name }: { name: string }) => {
            await page.getByRole('button', { name: 'Select branch: main', exact: true }).click()

            if (action === 'select') {
              await page
                .locator('.branch-selector__popup .combobox__entry', { hasText: branchName })
                .click()
            } else {
              await page.getByRole('button', { name: 'Create new branch', exact: true }).click()

              const modal = page.locator('#new-branch')

              await modal.getByLabel('Branch name', { exact: false }).fill(name)

              const created = page.waitForResponse(
                (response) =>
                  new URL(response.url()).pathname === `/api/${branchesSlug}` &&
                  response.request().method() === 'POST',
              )

              await modal.getByRole('button', { name: 'Create and switch', exact: true }).click()

              const response = await created
              const { doc } = await response.json()

              expect(response.ok()).toBe(true)
              createdBranchIDs.push(doc.id)
              return doc.slug as string
            }

            return branch.slug
          }

          await chooseBranch({ name: `${branchName} Cancel` })

          const confirmation = page.locator('#leave-without-saving')

          await expect(confirmation).toBeVisible()
          await expect(confirmation.locator(':focus')).toHaveCount(1)
          await expect(
            confirmation.getByRole('heading', { name: 'Leave without saving' }),
          ).toBeVisible()
          await confirmation.getByRole('button', { name: 'Stay on this page' }).press('Enter')
          await expect(confirmation).toBeHidden()
          await expect(page).toHaveURL(editURL)
          await expect(page.locator('.branch-selector__trigger-name')).toHaveText('main')
          await expect(page.locator(fieldSelector)).toHaveValue('Unsaved content')
          expect(preferenceWrites).toHaveLength(0)

          const selectedSlug = await chooseBranch({ name: `${branchName} Confirm` })

          await expect(confirmation).toBeVisible()
          await expect(confirmation.locator(':focus')).toHaveCount(1)
          expect(preferenceWrites).toHaveLength(0)
          await confirmation.getByRole('button', { name: 'Leave anyway' }).press('Enter')
          await expect(page).toHaveURL(`${editURL}?branch=${selectedSlug}`)
          await expect(page.locator(fieldSelector)).toHaveValue('Saved content')
          await expect(confirmation).toBeHidden()
          await expect.poll(() => preferenceWrites.length).toBe(1)

          // The edit view can survive a query-string change. Its guard must rearm
          // after accepting a switch, and clean forms must still switch directly.
          await page.locator(fieldSelector).fill('More unsaved content')
          await page.locator('.branch-selector__trigger').click()
          await page
            .locator('.branch-selector__popup .combobox__entry', { hasText: /^main$/ })
            .click()
          await expect(confirmation).toBeVisible()
          await expect(confirmation.locator(':focus')).toHaveCount(1)
          await confirmation.getByRole('button', { name: 'Leave anyway' }).press('Enter')
          await expect(page).toHaveURL(editURL)
          await expect(page.locator(fieldSelector)).toHaveValue('Saved content')
          await page.locator('.branch-selector__trigger').click()
          await page
            .locator('.branch-selector__popup .combobox__entry', {
              hasText: action === 'select' ? branchName : `${branchName} Confirm`,
            })
            .click()
          await expect(page).toHaveURL(`${editURL}?branch=${selectedSlug}`)
          await expect(confirmation).toBeHidden()
        } finally {
          await page.close()

          if (postID !== undefined) {
            await payload.delete({
              collection: postsSlug,
              overrideAccess: true,
              id: postID,
            })
          }

          if (entity === 'global') {
            await payload.updateGlobal({
              slug: headerGlobalSlug,
              overrideAccess: true,
              data: { navLabel: header.navLabel },
            })
          }

          for (const id of createdBranchIDs) {
            await payload.delete({ collection: branchesSlug, overrideAccess: true, id })
          }

          const preferences = await payload.find({
            collection: 'payload-preferences',
            overrideAccess: true,
            where: { key: { equals: PREFERENCE_KEYS.NAV } },
            pagination: false,
          })

          for (const preference of preferences.docs) {
            await payload.delete({
              collection: 'payload-preferences',
              overrideAccess: true,
              id: preference.id,
            })
          }
        }
      })
    }
  }
})
