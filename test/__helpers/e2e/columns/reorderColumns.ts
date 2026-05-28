import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { wait } from 'payload/shared'

import { getColumnSelectorItem } from './clickPillSelectorItem.js'

export const reorderColumns = async (
  page: Page,
  {
    togglerSelector = '.columns-button__button',
    columnContainerSelector = '.popup__content .column-selector',
    fromColumn = 'Number',
    toColumn = 'ID',
  }: {
    columnContainerSelector?: string
    fromColumn: string
    toColumn: string
    togglerSelector?: string
  },
) => {
  // Scroll toggler to top of viewport so popup renders below it (fully visible)
  const toggler = page.locator(togglerSelector).first()
  await toggler.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    window.scrollBy({ top: rect.top - 100, behavior: 'instant' })
  })
  await wait(100)

  const columnContainer = page.locator(columnContainerSelector).first()
  const isAlreadyOpen = await columnContainer.isVisible()

  if (!isAlreadyOpen) {
    await toggler.click()
  }

  await expect(columnContainer).toBeVisible()

  // V4 column selector: drag listeners are on .column-selector__drag-handle
  const fromItem = getColumnSelectorItem({ container: columnContainer, label: fromColumn })
  const toItem = getColumnSelectorItem({ container: columnContainer, label: toColumn })

  const fromBoundingBox = await fromItem.locator('.column-selector__drag-handle').boundingBox()
  const toBoundingBox = await toItem.boundingBox()

  if (!fromBoundingBox || !toBoundingBox) {
    return
  }

  // Drag the "from" column to the "to" column position
  await page.mouse.move(fromBoundingBox.x + 2, fromBoundingBox.y + 2, { steps: 10 })
  await page.mouse.down()
  await wait(300)
  await page.mouse.move(toBoundingBox.x + 2, toBoundingBox.y + 2, { steps: 10 })
  await page.mouse.up()

  await expect(columnContainer.locator('.column-selector__item').first()).toHaveText(fromColumn)

  await expect(page.locator('table thead tr th').nth(1).first()).toHaveText(fromColumn)
  // TODO: This wait makes sure the preferences are actually saved. Just waiting for the UI to update is not enough. We should replace this wait
  await wait(1000)
}
