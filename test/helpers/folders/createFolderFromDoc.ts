import { expect, type Page } from '@playwright/test'

type Args = {
  folderName: string
  page: Page
}

export async function createFolderFromDoc({ folderName, page }: Args): Promise<void> {
  const addFolderButton = page.locator('.create-new-doc-in-folder__button', {
    hasText: 'Create folder',
  })
  await addFolderButton.click()

  const folderNameInput = page.locator('div.drawer-content-container input#field-name')

  await folderNameInput.fill(folderName)

  const createButton = page
    .locator('button[aria-label="Apply Changes"]')
    .filter({ hasText: 'Create' })
  await createButton.click()

  await expect(page.locator('.payload-toast-container')).toContainText('successfully')

  const folderCard = page.locator('.folder-file-card__name', { hasText: folderName }).first()
  await expect(folderCard).toBeVisible()
}
