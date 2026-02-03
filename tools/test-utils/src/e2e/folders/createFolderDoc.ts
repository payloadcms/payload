import { expect, type Page } from '@playwright/test'

import { closeAllToasts } from '../../helpers.js'
import { selectInput } from '../../helpers/e2e/selectInput.js'
export const createFolderDoc = async ({
  folderName,
  page,
  folderType,
}: {
  folderName: string
  folderType: string[]
  page: Page
}) => {
  const drawer = page.locator('dialog .collection-edit--payload-folders')
  await drawer.locator('input#field-name').fill(folderName)

  await selectInput({
    multiSelect: true,
    options: folderType,
    selectLocator: drawer.locator('#field-folderType'),
  })

  const createButton = drawer.getByRole('button', { name: 'Save' })
  await createButton.click()

  await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  await closeAllToasts(page)
}
