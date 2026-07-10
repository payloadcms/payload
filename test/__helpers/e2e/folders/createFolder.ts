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
  const drawer = page.locator('dialog .collection-edit--payload-folders')

  if (fromDropdown) {
    const titleActionsLocator = page.locator('.list-header__title-actions')
    const folderDropdown = titleActionsLocator.locator('.create-new-doc-in-folder__action-popup', {
      hasText: 'Create',
    })
    await folderDropdown.click()
    const createFolderButton = page.locator('.popup__content .popup-button-list__button', {
      hasText: 'Folder',
    })
    await expect(async () => {
      if (await drawer.isHidden()) {
        await createFolderButton.click()
      }
      await expect(drawer).toBeVisible()
    }).toPass({ timeout: 30000 })
  } else {
    const createFolderButton = page.locator(
      '.list-header__title-and-actions .create-new-doc-in-folder__button:has-text("Create folder")',
    )
    await expect(async () => {
      if (await drawer.isHidden()) {
        await createFolderButton.click()
      }
      await expect(drawer).toBeVisible()
    }).toPass({ timeout: 30000 })
  }

  await createFolderDoc({
    page,
    folderName,
    folderType,
  })

  const folderCard = page.locator('.folder-file-card__name', { hasText: folderName }).first()
  await expect(folderCard).toBeVisible()
}
