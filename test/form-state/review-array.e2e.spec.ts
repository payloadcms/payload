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

  for (const field of ['blocks', 'groups'] as const) {
    test(`should retain expanded ${field} rows after the server removes a collapsed predecessor`, async ({
      page,
    }) => {
      const doc = await payload.create({
        collection: autosavePostsSlug,
        data: {
          blocks: [
            { blockType: 'text', text: 'Remove this row' },
            { blockType: 'text', text: 'Keep this row' },
          ],
          groups: [{ text: 'Remove this row' }, { text: 'Keep this row' }],
          title: `ok Retained ${field} expansion`,
        },
        draft: true,
        overrideAccess: true,
      })
      const captured = deferred()
      const released = deferred()
      let hasCaptured = false

      try {
        await initPage({ page, serverURL })
        await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
        await waitForFormReady(page)
        await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
          const request = route.request()

          if (
            hasCaptured ||
            !isSave({ id: doc.id, request }) ||
            new URL(request.url()).searchParams.get('autosave') !== 'true'
          ) {
            return route.continue()
          }

          hasCaptured = true
          const response = await route.fetch()

          captured.resolve()
          await released.promise
          await route.fulfill({ response })
        })

        const firstToggle = page.locator(`#${field}-row-0 .collapsible__toggle`).first()
        const keptToggle = page.locator(`#${field}-row-1 .collapsible__toggle`).first()

        await expect(keptToggle).toHaveAttribute('aria-expanded', 'true')
        await page.locator(`#field-${field}__0__text`).fill('Remove on server')
        await captured.promise

        const savedPreferences = page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            response
              .url()
              .includes(`/payload-preferences/collection-${autosavePostsSlug}-${doc.id}`),
        )

        await firstToggle.press('Enter')
        await expect(firstToggle).toHaveAttribute('aria-expanded', 'false')
        await expect(keptToggle).toHaveAttribute('aria-expanded', 'true')
        await savedPreferences
        await keptToggle.focus()
        released.resolve()
        await expect(page.locator(`#${field}-row-1`)).toHaveCount(0)
        await expect(firstToggle).toHaveAttribute('aria-expanded', 'true')
        await expect(firstToggle).toBeFocused()
        await expect(page.locator(`#field-${field}__0__text`)).toBeVisible()
        await expect(page.locator(`#field-${field}__0__text`)).toHaveValue('Keep this row')
      } finally {
        released.resolve()
        await page.unrouteAll({ behavior: 'ignoreErrors' })
        await payload.delete({ id: doc.id, collection: autosavePostsSlug, overrideAccess: true })
      }
    })
  }

  for (const scenario of ['outer row', 'nested row', 'block', 'reordered row'] as const) {
    test(`should retain local child state after the server changes paths for ${scenario}`, async ({
      page,
    }) => {
      const doc = await payload.create({
        collection: autosavePostsSlug,
        data: {
          blocks: [
            { blockType: 'text', text: 'First block' },
            { blockType: 'text', text: 'Keep this block' },
          ],
          groups: [
            { text: 'First group' },
            {
              items: [{ text: 'First item' }, { text: 'Keep this item' }],
              text: 'Keep this group',
            },
          ],
          title: `ok Local child state for ${scenario}`,
        },
        draft: true,
        overrideAccess: true,
      })

      try {
        await initPage({ page, serverURL })
        await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
        await waitForFormReady(page)

        const localState = ({ rowID }: { rowID: string }) =>
          page
            .locator(`[id="${rowID}"]`)
            .getByRole('button', { name: 'Keep local row state', exact: true })

        await localState({ rowID: 'groups-row-1' }).first().press('Enter')
        await localState({ rowID: 'groups-1-items-row-1' }).press('Enter')
        await localState({ rowID: 'blocks-row-1' }).press('Enter')
        await expect(localState({ rowID: 'groups-row-1' }).first()).toHaveAttribute(
          'aria-pressed',
          'true',
        )
        await expect(localState({ rowID: 'groups-1-items-row-1' })).toHaveAttribute(
          'aria-pressed',
          'true',
        )
        await expect(localState({ rowID: 'blocks-row-1' })).toHaveAttribute('aria-pressed', 'true')

        if (scenario === 'block') {
          await page.locator('#field-blocks__0__text').fill('Remove on server')
          await expect(page.locator('#blocks-row-1')).toHaveCount(0)
          await expect(page.locator('#field-blocks__0__text')).toHaveValue('Keep this block')
          await expect(localState({ rowID: 'blocks-row-0' })).toHaveAttribute(
            'aria-pressed',
            'true',
          )
        } else if (scenario === 'nested row') {
          await page.locator('#field-groups__1__items__0__text').fill('Remove on server')
          await expect(page.locator('[id="groups-1-items-row-1"]')).toHaveCount(0)
          await expect(page.locator('#field-groups__1__items__0__text')).toHaveValue(
            'Keep this item',
          )
          await expect(localState({ rowID: 'groups-1-items-row-0' })).toHaveAttribute(
            'aria-pressed',
            'true',
          )
        } else {
          const isReorder = scenario === 'reordered row'

          await page
            .locator(isReorder ? '#field-groups__1__text' : '#field-groups__0__text')
            .fill(isReorder ? 'Move to start on server' : 'Remove on server')
          await expect(page.locator('#field-groups__0__text')).toHaveValue(
            isReorder ? 'Move to start on server' : 'Keep this group',
          )
          await expect(localState({ rowID: 'groups-row-0' }).first()).toHaveAttribute(
            'aria-pressed',
            'true',
          )
          await expect(localState({ rowID: 'groups-0-items-row-1' })).toHaveAttribute(
            'aria-pressed',
            'true',
          )

          if (isReorder) {
            await expect(localState({ rowID: 'groups-row-1' })).toHaveAttribute(
              'aria-pressed',
              'false',
            )
          } else {
            await expect(page.locator('#groups-row-1')).toHaveCount(0)
          }
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
      const localState = row.getByRole('button', { name: 'Keep local row state' }).first()
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

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}
