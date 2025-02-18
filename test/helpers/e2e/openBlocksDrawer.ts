import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

export const openBlocksDrawer = async ({
  page,
  fieldName = 'blocks',
  fieldLabelSingular = 'Block',
}: {
  fieldLabelSingular: string
  fieldName: string
  page: Page
}): Promise<Locator> => {
  const blocksDrawer = page.locator('[id^=drawer_1_blocks-drawer-]')

  if (!(await blocksDrawer.isVisible())) {
    const addButton = page.locator(`#field-${fieldName} > .blocks-field__drawer-toggler`)
    await expect(addButton).toContainText(`Add ${fieldLabelSingular}`)
    await addButton.click()
  }

  await expect(blocksDrawer).toBeVisible()

  return blocksDrawer
}
