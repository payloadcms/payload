import { expect, type Page } from '@playwright/test'

import { createFolderDoc } from './createFolderDoc.js'

type Args = {
  folderName: string
  folderType?: string[]
  fromDropdown?: boolean
  page: Page
}
export async function createFolder({
  folderName,
  fromDropdown = false,
  page,
  folderType = ['Posts'],
}: Args): Promise<void> {
  if (fromDropdown) {
    const titleActionsLocator = page.locator('.list-header__title-actions')
    const folderDropdown = titleActionsLocator.locator('.create-new-doc-in-folder__action-popup', {
      hasText: 'Create',
    })
    await folderDropdown.click()
    const createFolderButton = titleActionsLocator.locator('.popup-button-list__button', {
      hasText: 'Folder',
    })
    await createFolderButton.click()
  } else {
    const createFolderButton = page.locator(
      '.create-new-doc-in-folder__button:has-text("Create New")',
    )
    await createFolderButton.click()
  }

  await createFolderDoc({
    page,
    folderName,
    folderType,
  })

  const folderCard = page.locator('.folder-file-card__name', { hasText: folderName }).first()
  await expect(folderCard).toBeVisible()
}
