import type { Page } from '@playwright/test'

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
  const blocksField = page.locator(`#field-${fieldName}`).first()

  const fromField = blocksField.locator(`[id^="${fieldName}-row-${fromBlockIndex}"]`)

  const fromBoundingBox = await fromField.locator(`.collapsible__drag`).boundingBox()

  const toField = blocksField.locator(`[id^="${fieldName}-row-${toBlockIndex}"]`)

  const toBoundingBox = await toField.locator(`.collapsible__drag`).boundingBox()

  if (!fromBoundingBox || !toBoundingBox) {
    return
  }

  // drag the "from" column to the left of the "to" column
  await page.mouse.move(fromBoundingBox.x + 2, fromBoundingBox.y + 2, { steps: 10 })
  await page.mouse.down()
  await wait(300)
  await page.mouse.move(toBoundingBox.x - 2, toBoundingBox.y - 2, { steps: 10 })
  await page.mouse.up()
}
