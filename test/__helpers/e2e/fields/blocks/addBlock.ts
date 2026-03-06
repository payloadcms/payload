import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { exactText } from '../../helpers.js'
import { openArrayRowActions } from '../array/openArrayRowActions.js'
import { openBlocksDrawer } from './openBlocksDrawer.js'

const selectBlockFromDrawer = async ({
  blocksDrawer,
  blockToSelect,
}: {
  blocksDrawer: Locator
  blockToSelect: string
}) => {
  const blockCard = blocksDrawer.locator('.blocks-drawer__block .thumbnail-card__label', {
    hasText: blockToSelect,
  })

  await expect(blockCard).toBeVisible()

  await blocksDrawer.getByRole('button', { name: exactText(blockToSelect) }).click()
}

/**
 * Adds a block to the end of the blocks array using the primary "Add Block" button.
 */
export const addBlock = async ({
  page,
  fieldName = 'blocks',
  blockToSelect = 'Block',
}: {
  /**
   * The name of the block to select from the blocks drawer.
   */
  blockToSelect: string
  fieldName: string
  page: Page
}) => {
  const rowLocator = page.locator(
    `#field-${fieldName} > .blocks-field__rows > div > .blocks-field__row`,
  )

  const numberOfPrevRows = await rowLocator.count()

  const blocksDrawer = await openBlocksDrawer({ page, fieldName })

  await selectBlockFromDrawer({
    blocksDrawer,
    blockToSelect,
  })

  await expect(rowLocator).toHaveCount(numberOfPrevRows + 1)

  // expect to see the block on the page
}

/**
 * Like `addBlock`, but inserts the block at the specified index using the row actions menu.
 */
export const addBlockBelow = async (
  page: Page,
  {
    fieldName = 'blocks',
    blockToSelect = 'Block',
    rowIndex = 0,
  }: {
    /**
     * The name of the block to select from the blocks drawer.
     */
    blockToSelect: string
    fieldName: string
    /**
     * The index at which to insert the block.
     */
    rowIndex?: number
  },
) => {
  const rowLocator = page.locator(
    `#field-${fieldName} > .blocks-field__rows > div > .blocks-field__row`,
  )

  const numberOfPrevRows = await rowLocator.count()

  const { popupContentLocator, rowActionsButtonLocator } = await openArrayRowActions(page, {
    fieldName,
    rowIndex,
  })

  await popupContentLocator.locator('.array-actions__action.array-actions__add').click()

  const blocksDrawer = page.locator('[id^=drawer_1_blocks-drawer-]')

  await selectBlockFromDrawer({
    blocksDrawer,
    blockToSelect,
  })

  await expect(rowLocator).toHaveCount(numberOfPrevRows + 1)

  return { popupContentLocator, rowActionsButtonLocator }
}
