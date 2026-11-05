import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { wait } from 'payload/shared'

export const reorderBlocks = async ({
  page,
  fromBlockIndex = 1,
  toBlockIndex = 2,
  fieldName = 'blocks',
}: {
  fieldName?: string
  fromBlockIndex: number
  page: Page
  toBlockIndex: number
}) => {
  // Ensure blocks are loaded
  await expect(page.locator('.shimmer-effect')).toHaveCount(0)

  const blocksField = page.locator(`#field-${fieldName}`).first()

  const fromDrag = blocksField
    .locator(`[id^="${fieldName}-row-${fromBlockIndex}"]`)
    .locator(`.collapsible__drag`)

  const toDrag = blocksField
    .locator(`[id^="${fieldName}-row-${toBlockIndex}"]`)
    .locator(`.collapsible__drag`)

  await expect(fromDrag).toBeVisible()
  await expect(toDrag).toBeVisible()
  await fromDrag.scrollIntoViewIfNeeded()

  // Wait for layout to stabilize after framework hydration/re-renders
  await page.waitForTimeout(500)

  const fromBoundingBox = await fromDrag.boundingBox()
  const toBoundingBox = await toDrag.boundingBox()

  if (!fromBoundingBox || !toBoundingBox) {
    throw new Error('Could not find drag handle bounding boxes for block reordering')
  }

  await page.mouse.move(
    fromBoundingBox.x + fromBoundingBox.width / 2,
    fromBoundingBox.y + fromBoundingBox.height / 2,
    { steps: 10 },
  )
  await page.mouse.down()
  await wait(300)
  await page.mouse.move(
    toBoundingBox.x + toBoundingBox.width / 2,
    toBoundingBox.y + toBoundingBox.height / 2,
    { steps: 10 },
  )
  await page.mouse.up()

  await page.waitForTimeout(400)

  // Ensure blocks are loaded
  await expect(page.locator('.shimmer-effect')).toHaveCount(0)
}
