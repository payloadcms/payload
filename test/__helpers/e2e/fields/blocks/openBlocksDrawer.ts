import type { Locator, Page } from '@playwright/test'

import { testIds } from '@payloadcms/ui/shared'
import { expect } from '@playwright/test'

export const openBlocksDrawer = async ({
  page,
  fieldName = 'blocks',
}: {
  fieldName: string
  page: Page
}): Promise<Locator> => {
  const blocksDrawer = page.locator('[id^=drawer_1_blocks-drawer-]')

  if (!(await blocksDrawer.isVisible())) {
    const addButton = page.getByTestId(testIds.blocks.addButton(fieldName))
    await addButton.click()
  }

  await expect(blocksDrawer).toBeVisible()

  return blocksDrawer
}
