import { expect, type Page } from '@playwright/test'

import { closeAllToasts } from '../helpers.js'
import { selectInput } from '../selectInput.js'
export const createFolderDoc = async ({
  folderName,
  folderType,
  page,
}: {
  folderName: string
  folderType: string[]
  page: Page
}) => {
  const drawer = page.locator('dialog .collection-edit--payload-folders')
  await drawer.getByRole('textbox', { name: /^Name/ }).fill(folderName)

  await selectInput({
    multiSelect: true,
    options: folderType,
    page,
    selectLocator: drawer.locator('#field-folderType'),
  })

  const createButton = drawer.getByRole('button', { name: 'Save' })
  await createButton.click()

  await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  await closeAllToasts(page)
}
