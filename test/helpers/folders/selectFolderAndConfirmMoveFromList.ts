import type { Page } from '@playwright/test'

import { clickFolderCard } from './clickFolderCard.js'

type Args = {
  folderName?: string
  page: Page
  rowIndex?: number
}
export async function selectFolderAndConfirmMoveFromList({
  page,
  folderName,
  rowIndex = 1,
}: Args): Promise<void> {
  const firstListItem = page.locator(`tbody .row-${rowIndex}`)
  const folderPill = firstListItem.locator('.move-doc-to-folder')
  await folderPill.click()

  if (folderName) {
    await clickFolderCard({ folderName, doubleClick: true, page })
  }

  const selectButton = page
    .locator('button[aria-label="Apply Changes"]')
    .filter({ hasText: 'Select' })
  await selectButton.click()
  const confirmMoveButton = page
    .locator('dialog#move-folder-drawer-confirm-move')
    .getByRole('button', { name: 'Move' })
  await confirmMoveButton.click()
}
