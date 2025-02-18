import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { exactText } from 'helpers.js'

import { openBlocksDrawer } from './openBlocksDrawer.js'

export const addBlock = async ({
  page,
  fieldName = 'blocks',
  blockLabel = 'Block',
}: {
  blockLabel: string
  fieldName: string
  page: Page
}) => {
  const blocksDrawer = await openBlocksDrawer({ page, fieldName })

  const blockCard = blocksDrawer.locator('.blocks-drawer__block .thumbnail-card__label', {
    hasText: blockLabel,
  })

  await expect(blockCard).toBeVisible()

  await blocksDrawer.getByRole('button', { name: exactText(blockLabel) }).click()

  // expect to see the block on the page
}
