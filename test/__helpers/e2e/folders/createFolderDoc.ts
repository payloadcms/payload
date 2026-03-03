import { testIds } from '@payloadcms/ui/shared'
import { expect, type Page } from '@playwright/test'

import { closeAllToasts } from '../helpers.js'
import { selectInput } from '../selectInput.js'
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
  await drawer.getByTestId(testIds.field('name')).locator('input').fill(folderName)

  await selectInput({
    multiSelect: true,
    options: folderType,
    selectLocator: drawer.getByTestId(testIds.field('folderType')),
  })

  const createButton = drawer.getByRole('button', { name: 'Save' })
  await createButton.click()

  await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  await closeAllToasts(page)
}
