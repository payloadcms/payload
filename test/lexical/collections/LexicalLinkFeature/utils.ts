import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { uploadsSlug } from '../../slugs.js'
import { LexicalHelpers } from '../utils.js'

export async function openNestedUploadDrawer({
  page,
  finalizedURL,
}: {
  finalizedURL: string
  page: Page
}) {
  const lexical = new LexicalHelpers(page)

  await lexical.editor.fill('custom link')
  await lexical.editor.selectText()
  await lexical.inlineToolbar.getByRole('button', { name: 'Link', exact: true }).click()

  const linkDrawer = page.locator('.lexical-link-edit-drawer')
  // The nested drawer makes this parent inert; label queries still allow checking its stored value.
  const assetLabelField = linkDrawer.getByLabel('Label', { exact: true })

  await linkDrawer.getByRole('textbox', { name: 'Enter a URL', exact: true }).fill(finalizedURL)
  await linkDrawer.getByRole('button', { name: 'Add Hyperlink' }).click()
  const blockDrawer = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Add Hyperlink' }) })

  await blockDrawer.getByRole('button', { name: 'Asset Link Block', exact: true }).click()
  await blockDrawer.getByRole('button', { name: 'Insert', exact: true }).click()
  await assetLabelField.fill('Client asset')
  await linkDrawer.getByRole('button', { name: 'Choose from existing' }).click()

  const uploadListDrawer = page.locator('dialog[id^=list-drawer_2_]').first()

  await uploadListDrawer
    .getByText(/payload.*\.jpg/)
    .first()
    .click()

  const selectedFilename = linkDrawer.locator('.upload-relationship-details__filename')

  await expect(selectedFilename).toHaveText(/payload.*\.jpg/)
  await linkDrawer
    .locator('.upload-relationship-details')
    .getByRole('button', { name: 'Edit', exact: true })
    .click()

  const uploadDocumentDrawer = page.locator(`dialog[id^=doc-drawer_${uploadsSlug}_2_]`).first()

  await expect(uploadDocumentDrawer).toBeVisible()
  return { lexical, linkDrawer, assetLabelField, selectedFilename, uploadDocumentDrawer }
}
