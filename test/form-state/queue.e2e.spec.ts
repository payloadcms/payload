import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('Shared form request queue', () => {
  let serverURL: string
  const releases = new Set<() => void>()

  test.beforeAll(async () => {
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
  })

  test.beforeEach(async ({ page }) => {
    await initPage({ page, serverURL })
  })

  test.afterEach(async ({ page }) => {
    releases.forEach((release) => release())
    releases.clear()
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })

  test('should keep the success toast when onSuccess closes the form', async ({ page }) => {
    await page.route('**/api/form-request', (route) =>
      route.fulfill({ json: { message: 'Saved request' } }),
    )
    await page.route('**/api/form-request-reset', async (route) => {
      await expect(page.locator('#request-title')).toHaveCount(0)
      await route.fulfill({ json: {} })
    })
    await page.goto(`${serverURL}/admin/form-requests?scenario=unmount`)
    await page.getByRole('button', { name: 'Submit request', exact: true }).click()
    await expect(page.getByTestId('submission-result')).not.toHaveText('Not submitted')
    await expect(page.getByText('Saved request', { exact: true })).toBeVisible()
  })

  test('should return the completed response when onSuccess closes the form', async ({ page }) => {
    await page.route('**/api/form-request', (route) =>
      route.fulfill({ json: { message: 'Saved request' }, status: 201 }),
    )
    await page.route('**/api/form-request-reset', async (route) => {
      await expect(page.locator('#request-title')).toHaveCount(0)
      await route.fulfill({ json: {} })
    })
    await page.goto(`${serverURL}/admin/form-requests?scenario=unmount`)
    await page.getByRole('button', { name: 'Submit request', exact: true }).click()
    await expect(page.getByTestId('submission-result')).toHaveText('201')
  })

  for (const status of [200, 400]) {
    test(`should keep the custom response handler's ${status < 400 ? 'success' : 'error'} toast after closing the form`, async ({
      page,
    }) => {
      await page.route('**/api/form-request', (route) =>
        route.fulfill({ json: { message: 'Handled response' }, status }),
      )
      await page.route('**/api/form-request-reset', async (route) => {
        await expect(page.locator('#request-title')).toHaveCount(0)
        await route.fulfill({ json: {} })
      })
      await page.goto(`${serverURL}/admin/form-requests?scenario=custom-response`)
      await page.getByRole('button', { name: 'Submit request', exact: true }).click()
      await expect(page.getByTestId('submission-result')).not.toHaveText('Not submitted')
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      )
      await expect(page.getByText('Handled response', { exact: true })).toBeVisible()
      await expect(page.locator('[data-sonner-toast]')).toHaveAttribute('data-removed', 'false')
    })
  }

  test('should show an error thrown by a custom response handler after closing the form', async ({
    page,
  }) => {
    await page.route('**/api/form-request', (route) =>
      route.fulfill({ json: { message: 'Saved request' } }),
    )
    await page.route('**/api/form-request-reset', async (route) => {
      await expect(page.locator('#request-title')).toHaveCount(0)
      await route.fulfill({ json: {} })
    })
    await page.goto(`${serverURL}/admin/form-requests?scenario=custom-response-error`)
    const consoleListeners = page.listeners('console')

    page.removeAllListeners('console')
    page.on('console', (message) => {
      if (message.text().startsWith('Error submitting form Error: Response handler failed')) {
        return
      }

      consoleListeners.forEach((listener) => listener(message))
    })
    await page.getByRole('button', { name: 'Submit request', exact: true }).click()
    await expect(page.getByTestId('submission-result')).not.toHaveText('Not submitted')
    await expect(
      page.locator('[data-sonner-toast]').getByText('Response handler failed', { exact: true }),
    ).toBeVisible()
  })

  for (const action of ['Reset form', 'Close form']) {
    test(`should ignore a response canceled by ${action.toLowerCase()} before it arrives`, async ({
      page,
    }) => {
      const captured = Promise.withResolvers<void>()
      const released = Promise.withResolvers<void>()

      releases.add(released.resolve)
      await page.route('**/api/form-request', async (route) => {
        captured.resolve()
        await released.promise
        await route.fulfill({ json: { message: 'Canceled response' } })
      })
      await page.goto(`${serverURL}/admin/form-requests?scenario=unmount`)
      await page.getByRole('button', { name: 'Submit request', exact: true }).click()
      await captured.promise
      await page.getByRole('button', { name: action, exact: true }).click()
      released.resolve()
      await expect(page.getByTestId('submission-result')).toHaveText('No response')
      await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)
    })
  }

  for (const scenario of ['reset', 'reset-unmount']) {
    test(`should dismiss the submitting toast when onSuccess performs a ${scenario}`, async ({
      page,
    }) => {
      await page.route('**/api/form-request', (route) =>
        route.fulfill({ json: { message: 'Canceled response' } }),
      )
      await page.route('**/api/form-request-reset', (route) => route.fulfill({ json: {} }))
      await page.goto(`${serverURL}/admin/form-requests?scenario=${scenario}`)
      await page.getByRole('button', { name: 'Submit request', exact: true }).click()
      await expect(page.getByTestId('submission-result')).toHaveText('No response')
      await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)
    })
  }

  test('should notify field context subscribers only when fields change', async ({ page }) => {
    await page.goto(`${serverURL}/admin/form-requests?scenario=context`)
    await expect(page.locator('#request-title')).toHaveValue('Initial value')
    const updates = page.getByTestId('field-context-updates')

    await expect(updates).not.toHaveText('0')
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    )
    const initialUpdates = await updates.textContent()

    await page.getByRole('button', { name: 'Start processing', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Stop processing', exact: true })).toBeVisible()
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    )
    await expect(updates).toHaveText(initialUpdates!)
    await page.getByRole('button', { name: 'Stop processing', exact: true }).click()
    await page.locator('#request-title').fill('Changed field')
    await expect(updates).not.toHaveText(initialUpdates!)
  })

  test('should restore field focus after a keyboard submission', async ({ page }) => {
    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()

    releases.add(released.resolve)
    await page.route('**/api/form-request', async (route) => {
      captured.resolve()
      await released.promise
      await route.fulfill({ json: { message: 'Saved' } })
    })
    await page.goto(`${serverURL}/admin/form-requests?scenario=focus`)
    const title = page.locator('#request-title')

    await expect(title).toHaveValue('Initial value')
    await title.focus()
    await title.press('Enter')
    await captured.promise
    await expect(title).toBeDisabled()
    released.resolve()
    await expect(title).toBeEnabled()
    await expect(title).toBeFocused()
  })

  test('should wait for a form-state refresh before starting an explicit save', async ({
    page,
  }) => {
    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    const saved = Promise.withResolvers<Record<string, unknown>>()

    releases.add(released.resolve)
    await page.route('**/api/form-request-change', async (route) => {
      captured.resolve()
      await released.promise
      await route.fulfill({
        json: {
          ...route.request().postDataJSON(),
          computed: { addedByServer: true, value: 'Refresh-computed value' },
        },
      })
    })
    await page.route('**/api/form-request', async (route) => {
      saved.resolve(readSubmittedData({ body: route.request().postData() ?? '' }))
      await route.fulfill({ json: { message: 'Saved' } })
    })
    await openForm({ page, serverURL })
    await page.locator('#request-title').fill('Edited value')
    await captured.promise
    await page.getByRole('button', { name: 'Submit request', exact: true }).click()
    released.resolve()
    await expect(saved.promise).resolves.toMatchObject({ computed: 'Refresh-computed value' })
    await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  })

  test('should submit values merged by the preceding queued autosave', async ({ page }) => {
    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    const savedTitle = Promise.withResolvers<string>()
    let requestCount = 0

    releases.add(released.resolve)
    await page.route('**/api/form-request-change', (route) =>
      route.fulfill({ json: route.request().postDataJSON() }),
    )
    await page.route('**/api/form-request', async (route) => {
      requestCount += 1
      if (requestCount === 1) {
        captured.resolve()
        await released.promise
        await route.fulfill({
          json: { message: 'Saved', state: { title: { value: 'Server-computed value' } } },
        })
      } else {
        const body = route.request().postData() ?? ''
        savedTitle.resolve(readSubmittedData({ body }).title as string)
        await route.fulfill({ json: { message: 'Saved' } })
      }
    })
    await openForm({ page, serverURL })
    await page.getByRole('button', { name: 'Autosave request', exact: true }).click()
    await captured.promise
    await page.getByRole('button', { name: 'Submit request', exact: true }).click()
    released.resolve()
    await expect(savedTitle.promise).resolves.toBe('Server-computed value')
    await expect(page.locator('#request-title')).toHaveValue('Server-computed value')
  })
})

async function openForm({ page, serverURL }: { page: Page; serverURL: string }) {
  await page.goto(`${serverURL}/admin/form-requests?scenario=queue`)
  await expect(page.locator('#request-title')).toHaveValue('Initial value')
}

function readSubmittedData({ body }: { body: string }): Record<string, unknown> {
  const data = body.match(/name="_payload"\r?\n\r?\n([^\r\n]+)/)?.[1]

  if (!data) {
    throw new Error('The form request did not contain a serialized payload')
  }

  return JSON.parse(data) as Record<string, unknown>
}
