import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { wait } from 'payload/shared'

import { exactText } from '../../helpers.js'

export const reorderColumns = async (
  page: Page,
  {
    togglerSelector = '.list-controls__toggle-columns',
    columnContainerSelector = '.list-controls__columns',
    fromColumn = 'Number',
    toColumn = 'ID',
  }: {
    columnContainerSelector?: string
    fromColumn: string
    toColumn: string
    togglerSelector?: string
  },
) => {
  const columnContainer = page.locator(columnContainerSelector).first()
  const isAlreadyOpen = await columnContainer.isVisible()

  if (!isAlreadyOpen) {
    await page.locator(togglerSelector).first().click()
  }

  await expect(page.locator(`${columnContainerSelector}.rah-static--height-auto`)).toBeVisible()

  const fromBoundingBox = await columnContainer
    .locator(`.column-selector .column-selector__column`, {
      hasText: exactText(fromColumn),
    })
    .boundingBox()

  const toBoundingBox = await columnContainer
    .locator(`.column-selector .column-selector__column`, {
      hasText: exactText(toColumn),
    })
    .boundingBox()

  if (!fromBoundingBox || !toBoundingBox) {
    return
  }

  // drag the "from" column to the left of the "to" column
  await page.mouse.move(fromBoundingBox.x + 2, fromBoundingBox.y + 2, { steps: 10 })
  await page.mouse.down()
  await wait(300)
  await page.mouse.move(toBoundingBox.x - 2, toBoundingBox.y - 2, { steps: 10 })
  await page.mouse.up()

  await expect(
    columnContainer.locator('.column-selector .column-selector__column').first(),
  ).toHaveText(fromColumn)

  await expect(page.locator('table thead tr th').nth(1).first()).toHaveText(fromColumn)
  // TODO: This wait makes sure the preferences are actually saved. Just waiting for the UI to update is not enough. We should replace this wait
  await wait(1000)
}
