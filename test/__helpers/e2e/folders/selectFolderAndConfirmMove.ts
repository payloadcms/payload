import type { Page } from '@playwright/test'

import { clickFolderCard } from './clickFolderCard.js'

type Args = {
  folderName?: string
  page: Page
}
export async function selectFolderAndConfirmMove({ folderName, page }: Args): Promise<void> {
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
