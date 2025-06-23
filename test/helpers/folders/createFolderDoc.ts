import { expect, type Page } from '@playwright/test'

import { selectReactSelectOptions } from '../../helpers/e2e/selectReactSelectOptions.js'
export const createFolderDoc = async ({
  folderName,
  page,
  folderType,
}: {
  folderName: string
  folderType: string[]
  page: Page
}) => {
  const folderNameInput = page.locator(
    '[class*="payload__modal-item--slug-doc-drawer_payload-folders_"] input#field-name',
  )

  await folderNameInput.fill(folderName)

  await selectReactSelectOptions({
    page,
    selector: '#field-folderType',
    options: folderType,
  })

  const createButton = page
    .locator('[class*="payload__modal-item--slug-doc-drawer_payload-folders_"]')
    .getByRole('button', { name: 'Save' })
  await createButton.click()

  await expect(page.locator('.payload-toast-container')).toContainText('successfully')
}
