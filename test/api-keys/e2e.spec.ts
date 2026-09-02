import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { payloadAPIKeysCollectionSlug } from 'payload'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { login } from '../__helpers/e2e/auth/login.js'
import { saveDocAndAssert } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { adminsSlug } from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: PayloadTestSDK<Config>
let serverURL: string

const { beforeAll, describe } = test

const OWNER_PASSWORD = 'Password123!'

describe('API Keys', () => {
  let page: Page
  let adminsURL: AdminUrlUtil

  let ownerCounter = 0
  const createdOwnerIDs: (number | string)[] = []
  const createdKeyIDs: (number | string)[] = []

  const createAdminOwner = async (apiKeyAccessLevel: 'canManage' | 'canSee' | 'none') => {
    ownerCounter += 1
    const owner = await payload.create({
      collection: adminsSlug,
      data: {
        apiKeyAccessLevel,
        email: `e2e-api-key-admin-${ownerCounter}@example.com`,
        password: OWNER_PASSWORD,
      },
    })
    createdOwnerIDs.push(owner.id)
    return owner
  }

  const createKeyFor = async (ownerID: number | string) => {
    const key = await payload.create({
      collection: payloadAPIKeysCollectionSlug,
      data: {
        name: 'Seeded key',
        owner: { relationTo: adminsSlug, value: ownerID },
      },
      overrideAccess: true,
    })
    createdKeyIDs.push(key.id)
    return key
  }

  test.afterEach(async () => {
    for (const id of createdKeyIDs) {
      await payload
        .delete({ id, collection: payloadAPIKeysCollectionSlug, overrideAccess: true })
        .catch(() => null)
    }
    createdKeyIDs.length = 0

    for (const id of createdOwnerIDs) {
      await payload.delete({ id, collection: adminsSlug, overrideAccess: true }).catch(() => null)
    }
    createdOwnerIDs.length = 0
  })

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    adminsURL = new AdminUrlUtil(serverURL, adminsSlug)

    // Warm up the local-API bridge - the very first request against a freshly booted
    // server can race the server actually being ready to accept connections, and unlike
    // page navigation, a raw fetch has no built-in retry for a connection refused.
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        await payload.find({ collection: adminsSlug, limit: 0 })
        break
      } catch (_error) {
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
    }

    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('should create a new API key through the join field drawer without closing it, revealing the real key with a working copy button', async () => {
    const owner = await createAdminOwner('canManage')
    await login({ data: { email: owner.email, password: OWNER_PASSWORD }, page, serverURL })

    await page.goto(adminsURL.edit(owner.id))

    const joinField = page.locator('#field-apiKeys')
    await expect(joinField).toBeVisible()
    await joinField.locator('button.relationship-table__add-new').click()

    const drawer = page.locator(`[id^=doc-drawer_${payloadAPIKeysCollectionSlug}_]`).last()
    await expect(drawer).toBeVisible()

    await drawer.locator('#field-name').fill('E2E created key')
    await saveDocAndAssert(
      page,
      `[id^=doc-drawer_${payloadAPIKeysCollectionSlug}_] button#action-save`,
    )

    // The drawer must stay open after create - closing it (or refetching its content)
    // would hide the one-time secret before the user has a chance to see or copy it.
    await expect(drawer).toBeVisible()

    const keyInput = drawer.locator('.api-key-input__field')
    await expect(keyInput).not.toHaveValue('')
    await expect(keyInput).not.toHaveValue(/^•+$/)

    await expect(drawer.locator('.copy-to-clipboard')).toBeVisible()

    // Track the created key for cleanup.
    const { docs } = await payload.find({
      collection: payloadAPIKeysCollectionSlug,
      where: { name: { equals: 'E2E created key' } },
    })
    if (docs[0]) {
      createdKeyIDs.push(docs[0].id)
    }
  })

  test('should show a masked placeholder, not an empty field, when reopening an existing key', async () => {
    const owner = await createAdminOwner('canManage')
    const key = await createKeyFor(owner.id)
    await login({ data: { email: owner.email, password: OWNER_PASSWORD }, page, serverURL })

    await page.goto(adminsURL.edit(owner.id))

    const joinField = page.locator('#field-apiKeys')
    await joinField
      .locator('tr', { hasText: 'Seeded key' })
      .locator('.drawer-link__doc-drawer-toggler')
      .click()

    const drawer = page.locator(
      `[id^="doc-drawer_${payloadAPIKeysCollectionSlug}_"][id*="_${key.id}_"]`,
    )
    await expect(drawer).toBeVisible()

    const keyInput = drawer.locator('.api-key-input__field')
    await expect(keyInput).toHaveValue(/^•+$/)

    // Nothing real to copy or reveal for an already-hidden key.
    await expect(drawer.locator('.copy-to-clipboard')).toBeHidden()
    await expect(drawer.locator('.api-key-input__toggle')).toBeHidden()
  })

  test('should update the key and stay unmodified when regenerating, without enabling the Save button', async () => {
    const owner = await createAdminOwner('canManage')
    const key = await createKeyFor(owner.id)
    await login({ data: { email: owner.email, password: OWNER_PASSWORD }, page, serverURL })

    await page.goto(adminsURL.edit(owner.id))

    const joinField = page.locator('#field-apiKeys')
    await joinField
      .locator('tr', { hasText: 'Seeded key' })
      .locator('.drawer-link__doc-drawer-toggler')
      .click()

    const drawer = page.locator(
      `[id^="doc-drawer_${payloadAPIKeysCollectionSlug}_"][id*="_${key.id}_"]`,
    )
    await expect(drawer).toBeVisible()

    const saveButton = drawer.locator('button#action-save')
    await expect(saveButton).toBeDisabled()

    await drawer.getByRole('button', { name: 'Generate new API key' }).click()
    await page.locator(`#regenerate-api-key-${key.id} [data-dialog-action="confirm"]`).click()

    await expect(page.locator('.payload-toast-container')).toContainText('New API Key Generated')

    const keyInput = drawer.locator('.api-key-input__field')
    await expect(keyInput).not.toHaveValue('')
    await expect(keyInput).not.toHaveValue(/^•+$/)

    // Regenerating already persisted the change server-side - it must not also mark the
    // form modified, which would enable Save for a change that was never unsaved.
    await expect(saveButton).toBeDisabled()
  })

  test('should let a manage-tier administrator regenerate another administrator’s key', async () => {
    const keyOwner = await createAdminOwner('none')
    const key = await createKeyFor(keyOwner.id)
    const manageTierAdmin = await createAdminOwner('canManage')

    await login({
      data: { email: manageTierAdmin.email, password: OWNER_PASSWORD },
      page,
      serverURL,
    })

    await page.goto(adminsURL.edit(keyOwner.id))

    const joinField = page.locator('#field-apiKeys')
    await joinField
      .locator('tr', { hasText: 'Seeded key' })
      .locator('.drawer-link__doc-drawer-toggler')
      .click()

    const drawer = page.locator(
      `[id^="doc-drawer_${payloadAPIKeysCollectionSlug}_"][id*="_${key.id}_"]`,
    )
    await expect(drawer).toBeVisible()

    const regenerateButton = drawer.getByRole('button', { name: 'Generate new API key' })
    await expect(regenerateButton).toBeVisible()
    await regenerateButton.click()
    await page.locator(`#regenerate-api-key-${key.id} [data-dialog-action="confirm"]`).click()

    await expect(page.locator('.payload-toast-container')).toContainText('New API Key Generated')
  })

  test('should not show the regenerate button to a read-tier administrator viewing another administrator’s key', async () => {
    const keyOwner = await createAdminOwner('none')
    const key = await createKeyFor(keyOwner.id)
    const readTierAdmin = await createAdminOwner('canSee')

    await login({
      data: { email: readTierAdmin.email, password: OWNER_PASSWORD },
      page,
      serverURL,
    })

    await page.goto(adminsURL.edit(keyOwner.id))

    const joinField = page.locator('#field-apiKeys')
    await joinField
      .locator('tr', { hasText: 'Seeded key' })
      .locator('.drawer-link__doc-drawer-toggler')
      .click()

    const drawer = page.locator(
      `[id^="doc-drawer_${payloadAPIKeysCollectionSlug}_"][id*="_${key.id}_"]`,
    )
    await expect(drawer).toBeVisible()

    await expect(drawer.getByRole('button', { name: 'Generate new API key' })).toBeHidden()
  })
})
