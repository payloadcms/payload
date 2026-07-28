import { expect, type Page } from '@playwright/test'

import { createFolderDoc } from './createFolderDoc.js'

type Args = {
  folderName: string
  folderType?: string[]
  page: Page
}

export async function createFolderFromDoc({
  folderName,
  folderType = ['Posts'],
  page,
}: Args): Promise<void> {
  const addFolderButton = page.getByRole('button', { name: 'Create folder' })
  const drawer = page.locator('dialog .collection-edit--payload-folders')

  await expect(async () => {
    if (await drawer.isHidden()) {
      await addFolderButton.click()
    }
    await expect(drawer).toBeVisible()
  }).toPass({ timeout: 15000 })

  await createFolderDoc({
    folderName,
    folderType,
    page,
  })

  const folderCard = page.locator('.folder-file-card__name', { hasText: folderName }).first()
  await expect(folderCard).toBeVisible()
}
