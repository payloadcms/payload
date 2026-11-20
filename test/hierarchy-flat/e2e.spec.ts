import { expect, test } from '@playwright/test'

import { initPage } from '../__setup/e2e/initPage.js'

test('should open the move modal for a mixed folder and document selection', async ({ page }) => {
  const serverURL = `http://localhost:${process.env.PORT || 3000}`

  await initPage({ page, serverURL })
  await page.goto(`${serverURL}/admin/collections/flat-folders?view=hierarchy`)
  await page.getByRole('link', { name: 'Editorial' }).click()

  await page
    .getByRole('row', { name: /Planning Folders/ })
    .getByRole('checkbox')
    .check()
  await page
    .getByRole('row', { name: /Release notes Flat Articles/ })
    .getByRole('checkbox')
    .check()
  await page.getByRole('button', { name: 'Move', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Move to...' }).click()

  const modal = page.getByRole('dialog', { name: 'Move 2 Documents' })

  await expect(modal).toBeVisible()
  await modal.getByRole('button', { name: 'Editorial' }).click()
  await expect(modal.getByRole('checkbox', { name: 'Planning' })).toBeDisabled()
  await expect(modal.getByRole('checkbox', { name: 'Published' })).toBeEnabled()
})
