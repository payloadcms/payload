import { expect, type Page } from '@playwright/test'

type Args = {
  folderName: string
  fromDropdown?: boolean
  page: Page
}
export async function createFolder({
  folderName,
  fromDropdown = false,
  page,
}: Args): Promise<void> {
  if (fromDropdown) {
    const folderDropdown = page.locator('.create-new-doc-in-folder__popup-button', {
      hasText: 'Create',
    })
    await folderDropdown.click()
    const createFolderButton = page.locator('.popup-button-list__button', {
      hasText: 'Folder',
    })
    await createFolderButton.click()
  } else {
    const createFolderButton = page.locator(
      '.create-new-doc-in-folder__button:has-text("Create New")',
    )
    await createFolderButton.click()
  }

  const folderNameInput = page.locator(
    'dialog#create-document--header-pill-new-folder-drawer div.drawer-content-container input#field-name',
  )

  await folderNameInput.fill(folderName)

  const createButton = page.getByRole('button', { name: 'Apply Changes' })
  await createButton.click()

  await expect(page.locator('.payload-toast-container')).toContainText('successfully')

  const folderCard = page.locator('.folder-file-card__name', { hasText: folderName }).first()
  await expect(folderCard).toBeVisible()
}
