import type { Page } from '@playwright/test'

type Args = {
  doubleClick?: boolean
  folderName: string
  page: Page
}
export async function clickFolderCard({
  page,
  folderName,
  doubleClick = false,
}: Args): Promise<void> {
  const folderCard = page
    .locator('.folder-file-card')
    .filter({
      has: page.locator('.folder-file-card__name', { hasText: folderName }),
    })
    .first()

  const dragHandleButton = folderCard.locator('div[role="button"].folder-file-card__drag-handle')

  if (doubleClick) {
    await dragHandleButton.dblclick()
  } else {
    await dragHandleButton.click()
  }
}
