import type { Locator, Page } from 'playwright'

import { expect } from 'playwright/test'

import { closeAllToasts } from '../../../helpers.js'

export async function moveRow(
  page: Page,
  {
    fromIndex,
    toIndex,
    expected = 'success',
    scope,
  }: {
    expected?: 'success' | 'warning'
    fromIndex: number
    /**
     * Scope the sorting to a specific table in the DOM.
     * Useful when there are multiple sortable tables on the page.
     * If not provided, will search the first table on the page.
     */
    scope?: Locator
    toIndex: number
  },
) {
  const table = (scope || page).locator(`tbody`)
  await table.scrollIntoViewIfNeeded()

  const dragHandle = table.locator(`.sort-row`)
  const source = dragHandle.nth(fromIndex)
  const target = dragHandle.nth(toIndex)

  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()

  if (!sourceBox || !targetBox) {
    throw new Error(
      `Could not find elements to DnD. Probably the dndkit animation is not finished. Try increasing the timeout`,
    )
  }

  // steps is important: move slightly to trigger the drag sensor of DnD-kit
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2, {
    steps: 10,
  })

  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 10,
  })

  await page.mouse.up()

  await page.waitForTimeout(400) // dndkit animation

  if (expected === 'warning') {
    const toast = page.locator('.payload-toast-item.toast-warning')
    await expect(toast).toHaveText(
      'To reorder the rows you must first sort them by the "Order" column',
    )
    await closeAllToasts(page)
  }
}
