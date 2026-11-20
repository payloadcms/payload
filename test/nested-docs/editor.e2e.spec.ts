import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { pagesSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
let serverURL: string

test.beforeAll(async () => {
  ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
})

test('should show independent parent and folder controls in the editor', async ({ page }) => {
  await initPage({ page, serverURL })
  await page.goto(`${serverURL}/admin/collections/${pagesSlug}`)
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Careers')
  await page.getByRole('link', { name: 'Careers', exact: true }).click()

  const editor = page.locator('.collection-edit')

  await expect(editor.getByLabel('Title', { exact: false })).toHaveValue('Careers')
  await expect(editor.locator('#field-parent')).toBeVisible()
  await expect(editor.locator('.relationship').filter({ hasText: 'Parent document' })).toBeVisible()
  await expect(editor.getByRole('button', { name: 'Folder location: None', exact: true })).toBeVisible()
})
