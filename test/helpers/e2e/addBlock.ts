import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { openBlockDrawer } from './openBlockDrawer.js'

export const addBlock = async ({
  page,
  fieldName = 'blocks',
  blockLabelSingular = 'Block',
  fieldLabelSingular = 'Blocks',
}: {
  blockLabelSingular: string
  fieldLabelSingular: string
  fieldName: string
  page: Page
}) => {
  const blocksDrawer = await openBlockDrawer({ page, fieldName, fieldLabelSingular })

  const blockCard = blocksDrawer.locator('.blocks-drawer__block .thumbnail-card__label', {
    hasText: blockLabelSingular,
  })

  await expect(blockCard).toBeVisible()

  await page.getByRole('button', { name: blockLabelSingular }).click()

  // expect to see the block on the page
}
