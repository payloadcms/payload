import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

type Args = {
  doubleClick?: boolean
  folderName: string
  page: Page
  rootLocator?: Locator
}
export async function clickFolderCard({
  page,
  folderName,
  doubleClick = false,
  rootLocator,
}: Args): Promise<void> {
  const folderCard = (rootLocator || page)
    .locator('div[role="button"].draggable-with-click')
    .filter({
      has: page.locator('.folder-file-card__name', { hasText: folderName }),
    })
    .first()

  await folderCard.waitFor({ state: 'visible' })

  if (doubleClick) {
    // Release any modifier keys that might be held down from previous tests
    await page.keyboard.up('Shift')
    await page.keyboard.up('Control')
    await page.keyboard.up('Alt')
    await page.keyboard.up('Meta')
    await folderCard.dblclick()
    await expect(folderCard).toBeHidden()
  } else {
    await folderCard.click()
  }
}
