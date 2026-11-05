import { expect, type Page } from '@playwright/test'

import { createFolderDoc } from './createFolderDoc.js'

type Args = {
  folderName: string
  folderType?: string[]
  page: Page
}

export async function createFolderFromDoc({
  folderName,
  page,
  folderType = ['Posts'],
}: Args): Promise<void> {
  const addFolderButton = page.locator('.create-new-doc-in-folder__button', {
    hasText: 'Create folder',
  })
  const drawer = page.locator('dialog .collection-edit--payload-folders')

  await expect(async () => {
    if (await drawer.isHidden()) {
      await addFolderButton.click()
    }
    await expect(drawer).toBeVisible()
  }).toPass({ timeout: 15000 })

  await createFolderDoc({
    page,
    folderName,
    folderType,
  })

  const folderCard = page.locator('.folder-file-card__name', { hasText: folderName }).first()
  await expect(folderCard).toBeVisible()
}
