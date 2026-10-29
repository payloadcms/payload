import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { saveDocAndAssert, waitForFormReady } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { autosavePostsSlug, draftPostsSlug } from './collections/Autosave/index.js'
import { permissionSettingsSlug } from './slugs.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('Document permission refresh', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  test('should apply saved field permissions after an unrelated edit', async ({ page }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { content: 'Initial content', title: 'ok Initial permissions' },
      draft: true,
      overrideAccess: true,
    })
    const release = deferred()
    const captured = deferred()

    try {
      await initPage({ page, serverURL })
      await page.goto(new AdminUrlUtil(serverURL, draftPostsSlug).edit(doc.id))
      await waitForFormReady(page)

      let isFirstPermission = true

      await page.route(`**/api/${draftPostsSlug}/access/${doc.id}**`, async (route) => {
        const response = await route.fetch()

        if (!isFirstPermission) {
          return route.fulfill({ response })
        }

        isFirstPermission = false
        const json = await response.json()

        json.fields.title = { ...json.fields.title, read: true, update: false }
        captured.resolve()
        await release.promise
        await route.fulfill({ json, response })
      })

      await page.locator('#field-title').fill('ok Saved permissions')
      await saveDocAndAssert(page, '#action-save-draft')
      await captured.promise
      await expect(page.locator('#field-content')).toBeEditable()
      await page.locator('#field-content').fill('Edited while permissions load')
      release.resolve()

      await expect(page.locator('#field-title')).not.toBeEditable()
      await expect(page.locator('#field-title')).toHaveValue('ok Saved permissions')
      await expect(page.locator('#field-content')).toHaveValue('Edited while permissions load')
      await expect(page.locator('#action-save-draft')).toBeEnabled()
    } finally {
      release.resolve()
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      await payload.delete({ id: doc.id, collection: draftPostsSlug, overrideAccess: true })
    }
  })

  test('should refresh permissions from a descendant layout effect under Strict Mode', async ({
    page,
  }) => {
    const permissions = await mockPermissions({ page })

    await openPermissionRequests({ page })
    await expect(page.getByRole('button', { name: 'Save document', exact: true })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Publish document', exact: true })).toBeEnabled()
    expect(permissions.mountedRequests()).toBeGreaterThan(0)
  })

  test('should retain newer permissions when an older refresh completes last', async ({ page }) => {
    const permissions = await mockPermissions({ page })

    await openPermissionRequests({ page })

    const older = permissions.hold({ title: 'refresh-1', update: false })
    const newer = permissions.hold({ title: 'refresh-2', update: true })

    try {
      await page.getByRole('button', { name: 'Refresh permissions', exact: true }).click()
      await older.captured
      await page.getByRole('button', { name: 'Refresh permissions', exact: true }).click()
      await newer.captured
      newer.release()
      await expect(page.getByLabel('Completed permission refreshes')).toContainText('refresh-2')
      await expect(page.getByRole('button', { name: 'Save document', exact: true })).toBeEnabled()
      await expect(
        page.getByRole('button', { name: 'Publish document', exact: true }),
      ).toBeEnabled()
      older.release()
      await expect(page.getByLabel('Completed permission refreshes')).toContainText('refresh-1')
      await expect(page.getByRole('button', { name: 'Save document', exact: true })).toBeEnabled()
      await expect(
        page.getByRole('button', { name: 'Publish document', exact: true }),
      ).toBeEnabled()
    } finally {
      permissions.releaseAll()
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    }
  })

  for (const scope of ['document', 'collection', 'global', 'locale'] as const) {
    test(`should discard pending permissions after changing ${scope} scope`, async ({ page }) => {
      const permissions = await mockPermissions({ page })

      await openPermissionRequests({ page })

      const previousInstance = await page.getByLabel('Provider instance').textContent()
      const pending = permissions.hold({ title: 'refresh-1', update: true })

      try {
        await page.getByRole('button', { name: 'Refresh permissions', exact: true }).click()
        await pending.captured
        permissions.setMountedUpdate({ update: false })
        await page.getByRole('button', { name: `Change ${scope}`, exact: true }).click()

        const newScope = scope === 'locale' ? 'initial:fr' : `${scope}:en`

        await expect(page.getByLabel('Document scope')).toHaveText(newScope)
        await expect(page.getByLabel('Completed permission refreshes')).toContainText(
          `mounted-${newScope}`,
        )
        await expect(page.getByLabel('Provider instance')).toHaveText(previousInstance!)
        await expect(
          page.getByRole('button', { name: 'Save document', exact: true }),
        ).toBeDisabled()
        await expect(
          page.getByRole('button', { name: 'Publish document', exact: true }),
        ).toBeDisabled()
        pending.release()
        await expect(page.getByLabel('Completed permission refreshes')).toContainText('refresh-1')
        await expect(
          page.getByRole('button', { name: 'Save document', exact: true }),
        ).toBeDisabled()
        await expect(
          page.getByRole('button', { name: 'Publish document', exact: true }),
        ).toBeDisabled()
      } finally {
        permissions.releaseAll()
        await page.unrouteAll({ behavior: 'ignoreErrors' })
      }
    })
  }

  test('should ignore a retained permission callback from the previous document', async ({
    page,
  }) => {
    await mockPermissions({ page })
    await openPermissionRequests({ page })
    await page.getByRole('button', { name: 'Retain refresh callback' }).click()
    await page.getByRole('button', { name: 'Change document', exact: true }).click()
    await expect(page.getByLabel('Completed permission refreshes')).toContainText(
      'mounted-document:en',
    )
    await page.getByRole('button', { name: 'Refresh previous document' }).click()
    await expect(page.getByLabel('Completed permission refreshes')).toContainText('retained')
    await expect(page.getByRole('button', { name: 'Save document', exact: true })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Publish document', exact: true })).toBeEnabled()
  })

  test('should isolate a remounted document from a pending refresh and retained callback', async ({
    page,
  }) => {
    const permissions = await mockPermissions({ page })

    await openPermissionRequests({ page })

    const pending = permissions.hold({ title: 'refresh-1', update: false })

    try {
      await page.getByRole('button', { name: 'Retain refresh callback' }).click()
      await page.getByRole('button', { name: 'Refresh permissions', exact: true }).click()
      await pending.captured
      await page.getByRole('button', { name: 'Unmount document', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Save document', exact: true })).toHaveCount(0)
      pending.release()
      await expect(page.getByLabel('Completed permission refreshes')).toContainText('refresh-1')
      await page.getByRole('button', { name: 'Mount document', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Save document', exact: true })).toBeEnabled()
      await page.getByRole('button', { name: 'Refresh previous document' }).click()
      await expect(page.getByLabel('Completed permission refreshes')).toContainText('retained')
      await expect(page.getByRole('button', { name: 'Save document', exact: true })).toBeEnabled()
      await expect(
        page.getByRole('button', { name: 'Publish document', exact: true }),
      ).toBeEnabled()
    } finally {
      permissions.releaseAll()
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    }
  })

  test('should reject permissions when the caller invalidates a pending refresh', async ({
    page,
  }) => {
    const permissions = await mockPermissions({ page })

    await openPermissionRequests({ page })

    const pending = permissions.hold({ title: 'refresh-1', update: false })

    try {
      await page.getByRole('button', { name: 'Refresh permissions', exact: true }).click()
      await pending.captured
      await page.getByRole('button', { name: 'Invalidate refresh' }).click()
      pending.release()
      await expect(page.getByLabel('Completed permission refreshes')).toContainText('refresh-1')
      await expect(page.getByRole('button', { name: 'Save document', exact: true })).toBeEnabled()
      await expect(
        page.getByRole('button', { name: 'Publish document', exact: true }),
      ).toBeEnabled()
    } finally {
      permissions.releaseAll()
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    }
  })

  async function openPermissionRequests({ page }: { page: Page }) {
    await initPage({ page, serverURL })
    await page.goto(
      formatAdminURL({ adminRoute: '/admin', path: '/permission-requests?locale=en', serverURL }),
    )
    await expect(page.getByLabel('Completed permission refreshes')).toContainText(
      'mounted-initial:en',
    )
    await expect(page.getByLabel('Provider instance')).not.toBeEmpty()
    await expect(page.getByRole('button', { name: 'Save document', exact: true })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'Publish document', exact: true })).toBeEnabled()
  }
})

async function mockPermissions({ page }: { page: Page }) {
  const gates = new Map<
    string,
    {
      captured: ReturnType<typeof deferred>
      released: ReturnType<typeof deferred>
      update: boolean
    }
  >()
  let mountedUpdate = true
  let mountedRequests = 0

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname

    if (
      request.method() !== 'POST' ||
      !(
        pathname.includes(`/${draftPostsSlug}/access/`) ||
        pathname.includes(`/${autosavePostsSlug}/access/`) ||
        pathname.endsWith(`/globals/${permissionSettingsSlug}/access`)
      )
    ) {
      return route.continue()
    }

    const { _status, title } = request.postDataJSON()
    const gate = gates.get(title)
    const update = gate?.update ?? (title.startsWith('mounted-') ? mountedUpdate : false)

    if (_status === 'published') {
      if (title.startsWith('mounted-')) {
        mountedRequests++
      }
      gate?.captured.resolve()
      if (gate) {
        await gate.released.promise
      }
    }

    await route.fulfill({ json: { fields: true, ...(update ? { update: true } : {}) } })
  })

  return {
    hold: ({ title, update }: { title: string; update: boolean }) => {
      const captured = deferred()
      const released = deferred()

      gates.set(title, { captured, released, update })

      return { captured: captured.promise, release: () => released.resolve() }
    },
    mountedRequests: () => mountedRequests,
    releaseAll: () => gates.forEach(({ released }) => released.resolve()),
    setMountedUpdate: ({ update }: { update: boolean }) => {
      mountedUpdate = update
    },
  }
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}
