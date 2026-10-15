import type { Request } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { waitForFormReady } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { autosavePostsSlug } from './collections/Autosave/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('Authoritative autosave rows', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  test('should keep server-filtered rows removed on the next autosave', async ({ page }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: {
        blocks: [
          { blockType: 'text', text: 'First block' },
          { blockType: 'text', text: 'Keep this block' },
        ],
        title: 'ok Server-filtered blocks',
      },
      draft: true,
      overrideAccess: true,
    })

    try {
      await initPage({ page, serverURL })
      await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
      await waitForFormReady(page)
      await page.locator('#field-blocks__0__text').fill('Remove on server')
      await expect(page.locator('#field-blocks__0__text')).toHaveValue('Keep this block')
      await expect(page.locator('#field-blocks__1__text')).toHaveCount(0)

      const saved = page.waitForResponse(
        (response) =>
          response.request().method() === 'PATCH' &&
          response.url().includes(`/api/${autosavePostsSlug}/${doc.id}`) &&
          Boolean(response.request().postData()?.includes('Trigger the next autosave')),
      )

      await page.locator('#field-content').fill('Trigger the next autosave')
      await saved
      await expect
        .poll(async () => {
          const response = await page.request.get(
            formatAdminURL({
              apiRoute: '/api',
              path: `/${autosavePostsSlug}/${doc.id}`,
              serverURL,
            }),
            { params: { depth: 0, draft: true } },
          )
          const document = await response.json()

          return document.blocks?.map(({ id, text }: { id: string; text: string }) => ({
            id,
            text,
          }))
        })
        .toEqual([{ id: doc.blocks![1]!.id, text: 'Keep this block' }])
      await page.reload()
      await waitForFormReady(page)
      await expect(page.locator('#field-blocks__0__text')).toHaveValue('Keep this block')
      await expect(page.locator('#field-blocks__1__text')).toHaveCount(0)
    } finally {
      await payload.delete({ id: doc.id, collection: autosavePostsSlug, overrideAccess: true })
    }
  })

  for (const scenario of ['empty blocks', 'nested row', 'outer row', 'replaced block'] as const) {
    test(`should omit stale fields from the next autosave for ${scenario}`, async ({ page }) => {
      const doc = await payload.create({
        collection: autosavePostsSlug,
        data: {
          blocks: [{ blockType: 'text', text: 'Original block' }],
          groups: [
            { items: [{ text: 'First item' }, { text: 'Keep this item' }], text: 'First group' },
            { items: [{ text: 'Keep nested item' }], text: 'Keep this group' },
          ],
          title: `ok Authoritative ${scenario}`,
        },
        draft: true,
        overrideAccess: true,
      })

      try {
        await initPage({ page, serverURL })
        await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
        await waitForFormReady(page)

        const expectedBlocks =
          scenario === 'empty blocks'
            ? []
            : scenario === 'replaced block'
              ? [{ id: doc.blocks![0]!.id, blockType: 'number', number: 42 }]
              : getBlockFields({ blocks: doc.blocks })
        const expectedGroups =
          scenario === 'outer row'
            ? [doc.groups![1]]
            : scenario === 'nested row'
              ? [{ ...doc.groups![0], items: [doc.groups![0]!.items![1]] }, doc.groups![1]]
              : doc.groups

        if (scenario === 'nested row') {
          await page.locator('#field-groups__0__items__0__text').fill('Remove on server')
          await expect(page.locator('#field-groups__0__items__0__text')).toHaveValue(
            'Keep this item',
          )
          await expect(page.locator('#field-groups__0__items__1__text')).toHaveCount(0)
        } else if (scenario === 'outer row') {
          await page.locator('#field-groups__0__text').fill('Remove on server')
          await expect(page.locator('#field-groups__0__text')).toHaveValue('Keep this group')
          await expect(page.locator('#field-groups__1__text')).toHaveCount(0)
        } else {
          await page
            .locator('#field-blocks__0__text')
            .fill(scenario === 'empty blocks' ? 'Remove on server' : 'Replace on server')
          await expect(page.locator('#field-blocks__0__text')).toHaveCount(0)
          if (scenario === 'replaced block') {
            await expect(page.locator('#field-blocks__0__number')).toHaveValue('42')
          }
        }

        const content = `Next autosave after ${scenario}`
        const nextSave = page.waitForRequest(
          (request) =>
            isSave({ id: doc.id, request }) && Boolean(request.postData()?.includes(content)),
        )
        const saved = page.waitForResponse(
          (response) =>
            isSave({ id: doc.id, request: response.request() }) &&
            Boolean(response.request().postData()?.includes(content)),
        )

        await page.locator('#field-content').fill(content)

        const submitted = getSubmittedData({ request: await nextSave })

        // Empty rows serialize as a zero marker until the server sanitizes them to an array.
        expect(submitted.blocks).toEqual(scenario === 'empty blocks' ? 0 : expectedBlocks)
        expect(submitted.groups).toEqual(expectedGroups)
        expect((await saved).ok()).toBe(true)
        await expect
          .poll(async () => {
            const response = await page.request.get(
              formatAdminURL({
                apiRoute: '/api',
                path: `/${autosavePostsSlug}/${doc.id}`,
                serverURL,
              }),
              { params: { depth: 0, draft: true } },
            )
            const savedDoc = await response.json()

            return { blocks: getBlockFields({ blocks: savedDoc.blocks }), groups: savedDoc.groups }
          })
          .toEqual({ blocks: expectedBlocks, groups: expectedGroups })
        await page.reload()
        await waitForFormReady(page)
        await expect(page.locator('#field-content')).toHaveValue(content)
        if (scenario === 'outer row') {
          await expect(page.locator('#field-groups__0__items__0__text')).toHaveValue(
            'Keep nested item',
          )
          await expect(page.locator('#field-groups__1__text')).toHaveCount(0)
        } else if (scenario === 'nested row') {
          await expect(page.locator('#field-groups__0__items__0__text')).toHaveValue(
            'Keep this item',
          )
          await expect(page.locator('#field-groups__0__items__1__text')).toHaveCount(0)
        } else if (scenario === 'empty blocks') {
          await expect(page.locator('#field-blocks__0__text')).toHaveCount(0)
        } else {
          await expect(page.locator('#field-blocks__0__number')).toHaveValue('42')
          await expect(page.locator('#field-blocks__0__text')).toHaveCount(0)
        }
      } finally {
        await payload.delete({ id: doc.id, collection: autosavePostsSlug, overrideAccess: true })
      }
    })
  }

  test('should retain collapsed rows, custom fields and local-only row state after an authoritative merge', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: {
        groups: [{ items: [{ text: 'Kept nested item' }], text: 'Kept row' }],
        title: 'ok Retained row metadata',
      },
      draft: true,
      overrideAccess: true,
    })

    try {
      await initPage({ page, serverURL })
      await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
      await waitForFormReady(page)

      const row = page.locator('#groups-row-0')
      const localState = row.getByRole('button', { name: 'Keep local row state' })
      const toggle = row.locator('.collapsible__toggle').first()

      await localState.click()
      await expect(localState).toHaveAttribute('aria-pressed', 'true')
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')

      const nextSave = page.waitForRequest(
        (request) =>
          isSave({ id: doc.id, request }) &&
          Boolean(request.postData()?.includes('ok Retained metadata after save')),
      )

      await page.locator('#field-content').fill('Preserved sibling content')
      await page.locator('#field-title').fill('ok Retained metadata after save')
      expect(getSubmittedData({ request: await nextSave }).groups).toEqual(doc.groups)
      await expect(page.locator('#field-computedTitle')).toHaveValue(
        'ok Retained metadata after save',
      )
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await expect(row.locator('#custom-array-row-label')).toHaveText('This is a custom component')
      await toggle.click()
      await expect(localState).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('#field-groups__0__text')).toHaveValue('Kept row')
      await expect(page.locator('#field-content')).toHaveValue('Preserved sibling content')
    } finally {
      await payload.delete({ id: doc.id, collection: autosavePostsSlug, overrideAccess: true })
    }
  })
})

function isSave({ id, request }: { id: number | string; request: Request }) {
  return (
    request.method() === 'PATCH' &&
    new URL(request.url()).pathname.endsWith(`/${autosavePostsSlug}/${id}`)
  )
}

function getSubmittedData({ request }: { request: Request }) {
  const body = request.postData()!
  const match = body.match(/name="_payload"\r\n\r\n([^\r]+)/)

  return JSON.parse(match ? match[1]! : body)
}

function getBlockFields({
  blocks,
}: {
  blocks: { blockName?: null | string }[] | null | undefined
}) {
  return blocks?.map(({ blockName: _blockName, ...block }) => block)
}
