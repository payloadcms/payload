import type { BrowserContext, Page, Request } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'

import { saveDocAndAssert } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { apiKeysSlug, restrictedRevealableKeysSlug, revealableKeysSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const headers = {
  'Content-Type': 'application/json',
}

let apiURL: string
let context: BrowserContext
let existingAPIKey: string
let page: Page
let payload: PayloadTestSDK<TestConfig>
let serverURL: string
let url: AdminUrlUtil
let user: { id: number | string }

type TestConfig = {
  collections: {
    'api-keys': {
      apiKey?: null | string
      id: number | string
    }
    revealableKeys: {
      apiKey?: null | string
      email?: string
      id: number | string
      password?: string
    }
    users: {
      email?: string
      id: number | string
      password?: string
    }
  }
  globals: Record<string, { id: number | string }>
}

test.beforeAll(async ({ browser }, testInfo) => {
  testInfo.setTimeout(TEST_TIMEOUT_LONG)
  ;({ payload, serverURL } = await initPayloadE2ENoConfig<TestConfig>({ dirname }))
  apiURL = formatAdminURL({ apiRoute: '/api', path: '', serverURL })
  url = new AdminUrlUtil(serverURL, apiKeysSlug)

  context = await browser.newContext()
  ;({ page } = await initPage({ context, serverURL }))

  existingAPIKey = uuid()
  user = await payload.create({
    collection: apiKeysSlug,
    data: {
      name: 'Existing API key user',
      apiKey: existingAPIKey,
    },
    overrideAccess: true,
  })
})

test.afterAll(async () => {
  await context.close()
})

test.describe('API key fields', () => {
  test('should show only the preview for an existing API key', async () => {
    const revealRequests: string[] = []
    const trackRevealRequest = (request: Request) => {
      if (request.url().endsWith(`/${apiKeysSlug}/${user.id}/api-key/reveal`)) {
        revealRequests.push(request.url())
      }
    }

    page.on('request', trackRevealRequest)
    await page.goto(url.edit(user.id))

    const apiKeyLocator = page.locator('#apiKey')

    await expect(apiKeyLocator).toHaveValue(`${'•'.repeat(20)}${existingAPIKey.slice(-4)}`)
    await expect(apiKeyLocator).toHaveAttribute('type', 'text')
    expect(revealRequests).toHaveLength(0)
    await expect(page.locator('#reveal-api-key')).toHaveCount(0)
    page.off('request', trackRevealRequest)
  })

  test('should generate an API key locally during create and persist it on save', async () => {
    await page.goto(url.create)

    await expect(page.locator('#field-enableAPIKey')).toHaveCount(0)
    await expect(page.locator('label[for="apiKey"]')).toContainText('API Key')
    await expect(page.locator('.field-description-apiKey')).toHaveCount(0)
    await page.locator('#generate-api-key').click()
    await expect(page.getByRole('heading', { name: 'Confirm generation' })).toHaveCount(0)

    const apiKeyLocator = page.locator('#apiKey')
    await expect(apiKeyLocator).toHaveValue(/[0-9a-f-]{36}/)
    await expect(apiKeyLocator).toHaveAttribute('type', 'text')
    await expect(page.locator('#revoke-api-key')).toHaveCount(0)

    const apiKey = await apiKeyLocator.inputValue()

    const responseBeforeSave = await fetch(`${apiURL}/${apiKeysSlug}/me`, {
      headers: { ...headers, Authorization: `${apiKeysSlug} API-Key ${apiKey}` },
    }).then((response) => response.json())

    expect(responseBeforeSave.user).toBeNull()

    await page.locator('#field-name').fill('Generated key user')
    await saveDocAndAssert(page)

    await expect(async () => {
      const response = await fetch(`${apiURL}/${apiKeysSlug}/me`, {
        headers: { ...headers, Authorization: `${apiKeysSlug} API-Key ${apiKey}` },
      }).then((result) => result.json())

      expect(response.user).not.toBeNull()
    }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

    await page.reload()

    await expect(apiKeyLocator).toHaveValue(`${'•'.repeat(20)}${apiKey.slice(-4)}`)
    await expect(apiKeyLocator).toHaveAttribute('type', 'text')
  })

  test('should regenerate and revoke an API key', async () => {
    await page.goto(url.edit(user.id))

    await page.locator('#regenerate-api-key').click()
    await expect(
      page.getByText(`invalidate the key ending in ${existingAPIKey.slice(-4)}`, { exact: false }),
    ).toBeVisible()
    const updateRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' && request.url().includes(`/${apiKeysSlug}/${user.id}`),
    )
    await page.getByRole('button', { name: 'Generate', exact: true }).click()

    expect(new URL((await updateRequest).url()).searchParams.get('locale')).toBe('en')

    const apiKeyLocator = page.locator('#apiKey')
    const apiKeyInputWrap = page.locator('.api-key__input-wrap')
    await expect(apiKeyLocator).toBeVisible()
    await expect(apiKeyLocator).toHaveValue(/[0-9a-f-]{36}/)
    await expect(apiKeyLocator).toHaveAttribute('type', 'text')
    await expect(apiKeyInputWrap).toHaveClass(/--highlighted/)

    const regeneratedAPIKey = await apiKeyLocator.inputValue()
    await expect(async () => {
      const oldKeyResponse = await fetch(`${apiURL}/${apiKeysSlug}/me`, {
        headers: {
          ...headers,
          Authorization: `${apiKeysSlug} API-Key ${existingAPIKey}`,
        },
      }).then((res) => res.json())
      const newKeyResponse = await fetch(`${apiURL}/${apiKeysSlug}/me`, {
        headers: {
          ...headers,
          Authorization: `${apiKeysSlug} API-Key ${regeneratedAPIKey}`,
        },
      }).then((res) => res.json())

      expect(oldKeyResponse.user).toBeNull()
      expect(newKeyResponse.user?.id).toBe(user.id)
    }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

    await page.locator('#field-name').fill('Updated after regeneration')
    await saveDocAndAssert(page)
    await expect(apiKeyInputWrap).not.toHaveClass(/--highlighted/)
    await expect(apiKeyLocator).toHaveValue(`${'•'.repeat(20)}${regeneratedAPIKey.slice(-4)}`)
    await expect(page.locator('.api-key__label .copy-to-clipboard')).toHaveCount(0)
    await expect(page.locator('#toggle-api-key-visibility')).toHaveCount(0)

    await page.locator('#revoke-api-key').click()
    await expect(page.getByRole('heading', { name: 'Revoke API key?' })).toBeVisible()
    await page.getByRole('button', { name: 'Revoke', exact: true }).click()
    await expect(
      page.locator('.payload-toast-item.toast-success', {
        hasText: 'API key revoked successfully.',
      }),
    ).toBeVisible()
    await expect(apiKeyInputWrap).not.toHaveClass(/--highlighted/)

    await expect(async () => {
      const response = await fetch(`${apiURL}/${apiKeysSlug}/me`, {
        headers: {
          ...headers,
          Authorization: `${apiKeysSlug} API-Key ${regeneratedAPIKey}`,
        },
      }).then((res) => res.json())

      expect(response.user).toBeNull()
    }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

    await page.reload()
    await expect(page.locator('#generate-api-key')).toBeVisible()
  })
})

test.describe('revealable keys', () => {
  test('should not inject the reveal endpoint by default', async ({ request }) => {
    const response = await request.post(`${apiURL}/${apiKeysSlug}/${user.id}/api-key/reveal`)

    expect(response.status()).toBe(404)
  })

  test('should reject unauthenticated reveal requests', async ({ request }) => {
    const response = await request.post(`${apiURL}/${revealableKeysSlug}/example/api-key/reveal`, {
      headers: { DisableAutologin: 'true' },
    })

    expect(response.status()).toBe(403)
  })

  test('should allow admins to manage API keys when custom access permits it', async () => {
    const revealableKeysURL = new AdminUrlUtil(serverURL, restrictedRevealableKeysSlug)
    await page.goto(revealableKeysURL.create)
    await expect(page.locator('#field-email')).toHaveCount(0)
    await expect(page.locator('#field-password')).toHaveCount(0)

    const revealableKey = await payload.create({
      collection: restrictedRevealableKeysSlug,
      data: {},
      draft: true,
      overrideAccess: true,
    })

    await page.goto(revealableKeysURL.edit(revealableKey.id))
    await page.locator('#generate-api-key').click()
    await page.getByRole('button', { name: 'Generate', exact: true }).click()
    const apiKeyLocator = page.locator('#apiKey')
    await expect(apiKeyLocator).toHaveValue(/[0-9a-f-]{36}/)
    const apiKey = await apiKeyLocator.inputValue()

    const draft = await payload.find({
      collection: restrictedRevealableKeysSlug,
      draft: true,
      overrideAccess: true,
      where: { id: { equals: revealableKey.id } },
    })
    const authResponse = await fetch(`${apiURL}/${restrictedRevealableKeysSlug}/me`, {
      headers: {
        ...headers,
        Authorization: `${restrictedRevealableKeysSlug} API-Key ${apiKey}`,
      },
    }).then((response) => response.json())

    expect(draft.docs[0]?._status).toBe('draft')
    expect(authResponse.user?.id).toBe(revealableKey.id)
  })

  test('should reveal a stored key inline', async () => {
    const apiKey = uuid()
    const revealableKey = await payload.create({
      collection: revealableKeysSlug,
      data: {
        apiKey,
      },
      overrideAccess: true,
    })

    await page.goto(new AdminUrlUtil(serverURL, revealableKeysSlug).edit(revealableKey.id))
    const revealResponse = page.waitForResponse((response) =>
      response.url().endsWith(`/${revealableKeysSlug}/${revealableKey.id}/api-key/reveal`),
    )
    await page.locator('#reveal-api-key').click()

    expect((await revealResponse).headers()['cache-control']).toBe('no-store')
    await expect(page.locator('#apiKey')).toHaveValue(apiKey)
    await expect(page.locator('#toggle-api-key-visibility')).toBeVisible()
  })

  test('should report a reveal request failure', async () => {
    const revealableKey = await payload.create({
      collection: revealableKeysSlug,
      data: { apiKey: uuid() },
      overrideAccess: true,
    })
    const revealURL = `**/${revealableKeysSlug}/${revealableKey.id}/api-key/reveal`

    await page.goto(new AdminUrlUtil(serverURL, revealableKeysSlug).edit(revealableKey.id))
    await page.route(revealURL, (route) => route.abort())
    await page.locator('#reveal-api-key').click()

    await expect(page.getByText('Failed to reveal the API key.')).toBeVisible()
    await expect(page.locator('#reveal-api-key')).not.toHaveAttribute('aria-busy', 'true')
    await page.unroute(revealURL)
  })

  test('should report an API key update request failure', async () => {
    const apiKeyUser = await payload.create({
      collection: apiKeysSlug,
      data: { name: 'Failed update user', apiKey: uuid() },
      overrideAccess: true,
    })
    const updateURL = `**/${apiKeysSlug}/${apiKeyUser.id}*`

    await page.goto(url.edit(apiKeyUser.id))
    await page.route(updateURL, (route) => route.abort())
    await page.locator('#regenerate-api-key').click()
    await page.locator('#confirm-action').click()

    await expect(page.getByText('Failed to update the API key.')).toBeVisible()
    await page.unroute(updateURL)
  })
})
