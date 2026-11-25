import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'

import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { textFieldsSlug, uploadsSlug } from './slugs.js'

const monacoAssetsDir = fileURLToPath(
  new URL('../../node_modules/monaco-editor/min/vs/', import.meta.url),
)

let serverURL: string

test.describe('Standalone field inputs', () => {
  test.beforeAll(async () => {
    ;({ serverURL } = await initPayloadE2ENoConfig({
      dirname: fileURLToPath(new URL('.', import.meta.url)),
    }))
  })

  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const readyURL = formatAdminURL({ adminRoute: '/admin', path: '/standalone-inputs', serverURL })

    // Serve the installed Monaco assets so editor tests do not depend on a CDN.
    await page.route('https://cdn.jsdelivr.net/npm/monaco-editor@*/min/vs/**', async (route) => {
      const asset = new URL(route.request().url()).pathname.split('/min/vs/')[1]!

      await route.fulfill({
        headers: { 'Access-Control-Allow-Origin': '*' },
        path: path.join(monacoAssetsDir, asset),
      })
    })
    await initPage({ page, serverURL })
    await page.goto(readyURL)
    await expect(page.getByRole('heading', { name: 'Standalone field inputs' })).toBeVisible()
    await expect(page.locator('.standalone-inputs')).toBeVisible()
    await expect(
      page.locator('.standalone-inputs').locator('xpath=ancestor-or-self::form'),
    ).toHaveCount(0)
    await expect(page.locator('.standalone-inputs form')).toHaveCount(0)
    await expect(page.getByTestId('standalone-form-context')).toHaveText(Array(15).fill('absent'))
  })

  for (const label of ['Standalone text', 'Standalone textarea']) {
    test(`should edit ${label} with local state`, async ({ page }) => {
      const input = page.getByRole('textbox', { name: label, exact: true })

      await page
        .locator('.standalone-inputs label')
        .filter({ hasText: new RegExp(`^${label}$`) })
        .click()
      await expect(input).toBeFocused()
      await input.fill('Edited without a Form')
      await input.blur()
      await expect(input).toHaveValue('Edited without a Form')
    })
  }

  test('should toggle a checkbox with the keyboard', async ({ page }) => {
    const input = page.getByRole('checkbox', { name: 'Standalone checkbox', exact: true })

    await expect(input).not.toBeChecked()
    await input.focus()
    await input.press('Space')
    await expect(input).toBeChecked()
    await input.press('Space')
    await expect(input).not.toBeChecked()
  })

  test('should select and clear an option with local state', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Standalone select', exact: true })

    await input.focus()
    await input.press('ArrowDown')
    await input.press('End')
    await input.press('Enter')
    await expect(page.getByRole('status', { name: 'Standalone select value' })).toHaveText('two')
    await page
      .locator('.standalone-inputs .select')
      .getByRole('button', { name: 'Clear', exact: true })
      .click()
    await expect(page.getByRole('status', { name: 'Standalone select value' })).toHaveText('')
  })

  test('should create and remove text tags with local state', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Standalone tags', exact: true })

    await input.fill('First tag')
    await input.press('Enter')
    await input.fill('Second tag')
    await input.press('Enter')
    const value = page.getByRole('status', { name: 'Standalone tag values' })

    await expect(value).toHaveText('First tag, Second tag')
    await input.press('Backspace')
    await expect(value).toHaveText('First tag')
  })

  test('should select and clear a relationship with local state', async ({ page }) => {
    const response = await page.request.get(
      `${serverURL}/api/${textFieldsSlug}?limit=1&where[text][equals]=Seeded%20text%20document`,
    )

    await expect(response).toBeOK()
    const {
      docs: [doc],
    } = await response.json()
    const input = page.getByRole('combobox', { name: 'Standalone relationship', exact: true })

    await input.fill(doc.text)
    await page.getByRole('option', { name: doc.text, exact: true }).click()
    const value = page.getByRole('status', { name: 'Standalone relationship value' })

    await expect(value).toHaveText(String(doc.id))
    await page
      .locator('.standalone-inputs .relationship')
      .getByRole('button', { name: 'Clear', exact: true })
      .click()
    await expect(value).toHaveText('')
  })

  test('should select and remove an existing upload with local state', async ({ page }) => {
    const response = await page.request.get(`${serverURL}/api/${uploadsSlug}?limit=1&sort=id`)

    await expect(response).toBeOK()
    const {
      docs: [doc],
    } = await response.json()
    const input = page.getByRole('group', { name: 'Standalone upload', exact: true })

    await input.getByRole('button', { name: 'Choose from existing', exact: true }).click()
    const drawer = page.locator('dialog[id^="list-drawer_"]')

    await expect(drawer).toBeVisible()
    await drawer.getByText(doc.filename, { exact: true }).click()
    const value = page.getByRole('status', { name: 'Standalone upload value' })

    await expect(value).toHaveText(String(doc.id))
    await expect(drawer).toBeHidden()
    await input.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(value).toHaveText('')
    await expect(page.getByTestId('standalone-form-context')).toHaveText(Array(15).fill('absent'))
  })

  test('should edit a date without form state', async ({ page }) => {
    const input = page.getByRole('textbox', { name: 'Standalone date', exact: true })

    await expect(input).toBeVisible()
    await input.fill('2026-11-25')
    await input.press('Tab')
    await expect(input).toHaveValue('2026-11-25')
    await expect(page.getByRole('status', { name: 'Standalone date value' })).toHaveText(
      /^2026-11-25T/,
    )
  })

  test('should select a timezone without form state', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Timezone', exact: true })

    await input.focus()
    await input.press('ArrowDown')
    await input.press('End')
    await input.press('Enter')
    await expect(page.getByRole('status', { name: 'Standalone timezone value' })).toHaveText(
      'Europe/London',
    )
  })

  for (const { label, value } of [
    { label: 'code', value: 'const changed = 2;' },
    { label: 'JSON', value: '{"changed":2}' },
  ]) {
    test(`should edit ${label} without form state`, async ({ page }) => {
      const input = page.getByRole('textbox', { name: `Standalone ${label}`, exact: true })

      const editor = page.getByRole('region', { name: `Standalone ${label} editor` })

      await editor.locator('.monaco-editor').click({ position: { x: 80, y: 12 } })
      await expect(input).toBeFocused()
      // Monaco chooses shortcuts from the emulated user agent, not the test host OS.
      const selectAll = await page.evaluate(() =>
        navigator.userAgent.includes('Macintosh') ? 'Meta+A' : 'Control+A',
      )

      await input.press(selectAll)
      await input.press('Backspace')
      await expect(page.getByRole('status', { name: `Standalone ${label} value` })).toHaveText('')
      await page.keyboard.insertText(value)
      await expect(page.getByRole('status', { name: `Standalone ${label} value` })).toHaveText(
        value,
      )
    })
  }

  test('should increment and decrement with the standalone input stepper', async ({ page }) => {
    const stepper = page.getByRole('region', { name: 'Standalone input stepper' })
    const value = stepper.getByRole('status', { name: 'Standalone stepper value' })

    await stepper.getByRole('button', { name: 'Increment', exact: true }).click()
    await expect(value).toHaveText('1')
    await stepper.getByRole('button', { name: 'Decrement', exact: true }).click()
    await expect(value).toHaveText('0')
  })

  test('should search and clear with local state', async ({ page }) => {
    const control = page.getByRole('region', { name: 'Standalone search control' })
    const input = control.getByRole('textbox', { name: 'Standalone search', exact: true })

    await input.fill('Find this')
    await input.press('Enter')
    await expect(control.getByRole('status', { name: 'Standalone search value' })).toHaveText(
      'Find this',
    )
    await control.getByRole('button', { name: 'Clear search', exact: true }).click()
    await expect(input).toHaveValue('')
  })

  test('should reveal, hide and copy a read-only API key', async ({ context, page }) => {
    const control = page.getByRole('region', { name: 'Standalone API key control' })
    const input = control.getByLabel('Standalone API key', { exact: true })

    await expect(input).toHaveValue('standalone-test-key')
    await expect(input).toHaveAttribute('readonly', '')
    await expect(input).toHaveAttribute('type', 'password')
    await control.getByRole('button', { name: 'Show API key', exact: true }).click()
    await expect(input).toHaveAttribute('type', 'text')
    await control.getByRole('button', { name: 'Hide API key', exact: true }).click()
    await expect(input).toHaveAttribute('type', 'password')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await control.getByRole('button', { name: 'Copy', exact: true }).click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('standalone-test-key')
  })

  test('should select and clear with standalone ReactSelect', async ({ page }) => {
    const control = page.getByRole('region', { name: 'Standalone ReactSelect control' })
    const input = control.getByRole('combobox', { name: 'Standalone ReactSelect', exact: true })
    const value = control.getByRole('status', { name: 'Standalone ReactSelect value' })

    await input.focus()
    await input.press('ArrowDown')
    await input.press('Enter')
    await expect(value).toHaveText('one')
    await control.getByRole('button', { name: 'Clear', exact: true }).click()
    await expect(value).toHaveText('')
  })
})
