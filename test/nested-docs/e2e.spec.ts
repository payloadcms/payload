import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { articlesSlug, pagesSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
let serverURL: string

test.describe('Nested document tree', () => {
  test.beforeAll(async () => {
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
  })

  test.beforeEach(async ({ page }) => {
    await initPage({ page, serverURL })
    await page.goto(`${serverURL}/admin/collections/${pagesSlug}?sort=-title&limit=10`)
  })

  test('should show root documents in Tree and return to the full Table', async ({ page }) => {
    await page.getByRole('radio', { name: 'Tree', exact: true }).check()

    await expect(page.getByRole('link', { name: 'About us', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Our team', exact: true })).toHaveCount(0)

    await page.getByRole('radio', { name: 'Table', exact: true }).check()

    await expect(page.getByRole('link', { name: 'Our team', exact: true })).toBeVisible()
  })

  test('should keep Trash as a flat list', async ({ page }) => {
    await page.goto(`${serverURL}/admin/collections/${articlesSlug}/trash`)

    await expect(page.getByRole('radio', { name: 'Tree', exact: true })).toHaveCount(0)
  })

  test('should expand one authorized branch in Tree', async ({ page }) => {
    await page.getByRole('radio', { name: 'Tree', exact: true }).check()
    const expand = page.getByRole('button', { name: 'Expand: About us', exact: true })

    await expand.focus()
    await page.keyboard.press('Enter')

    await expect(page.getByRole('link', { name: 'Department 12', exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Collapse: About us', exact: true }),
    ).toBeFocused()
  })

  test('should page through children and restore an expanded branch', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 480 })
    await page.getByRole('radio', { name: 'Tree', exact: true }).check()
    await page.getByRole('button', { name: 'Expand: About us', exact: true }).click()

    await expect(page.getByRole('link', { name: 'Department 04', exact: true })).toBeVisible()
    await page.getByRole('button', { name: /^Load more:/ }).scrollIntoViewIfNeeded()

    await expect(page.getByRole('link', { name: 'Department 01', exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('link', { name: 'Department 12', exact: true })).toBeVisible()
  })
})
