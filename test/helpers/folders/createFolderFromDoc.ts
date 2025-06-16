import { expect, type Page } from '@playwright/test'

import { createFolder } from './createFolder.js'
import { createFolderDoc } from './createFolderDoc.js'

type Args = {
  assignedCollections?: string[]
  folderName: string
  page: Page
}

export async function createFolderFromDoc({
  folderName,
  page,
  assignedCollections = ['Posts'],
}: Args): Promise<void> {
  const addFolderButton = page.locator('.create-new-doc-in-folder__button', {
    hasText: 'Create folder',
  })
  await addFolderButton.click()

  await createFolderDoc({
    page,
    folderName,
    assignedCollections,
  })

  const folderCard = page.locator('.folder-file-card__name', { hasText: folderName }).first()
  await expect(folderCard).toBeVisible()
}
