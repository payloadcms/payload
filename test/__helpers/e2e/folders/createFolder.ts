import { expect, type Page } from '@playwright/test'

import { createFolderDoc } from './createFolderDoc.js'
import { openFolderDrawer } from './openFolderDrawer.js'

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
  await openFolderDrawer({
    openDrawer: async () => {
      if (fromDropdown) {
        const titleActionsLocator = page.locator('.list-header__title-actions')
        const folderDropdown = titleActionsLocator.locator(
          '.create-new-doc-in-folder__action-popup',
          { hasText: 'Create' },
        )
        await folderDropdown.click()
        await page
          .locator('.popup__content .popup-button-list__button', { hasText: 'Folder' })
          .click()
      } else {
        await page
          .locator(
            '.list-header__title-and-actions .create-new-doc-in-folder__button:has-text("Create folder")',
          )
          .click()
      }
    },
    page,
  })

  await createFolderDoc({
    page,
    folderName,
    folderType,
  })

  const folderCard = page.locator('.folder-file-card__name', { hasText: folderName }).first()
  await expect(folderCard).toBeVisible()
}
