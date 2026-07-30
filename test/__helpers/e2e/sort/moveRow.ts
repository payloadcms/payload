import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { closeAllToasts } from '../helpers.js'

const mustSortByOrderMessage = 'To reorder the rows you must first sort them by the "Order" column'

export async function moveRow(
  page: Page,
  {
    fromIndex,
    toIndex,
    expected = 'success',
    scope,
  }: {
    /**
     * `'disabled'` asserts that the drag handle does not start a drag at all, which is the
     * case when the table is not currently sorted by the orderable field.
     */
    expected?: 'disabled' | 'success'
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

  if (expected === 'disabled') {
    await expect(page.locator('.payload-toast-item')).toHaveCount(0)
  }
}

/**
 * Focuses a row's drag handle and presses Space on it, the key dnd-kit's keyboard sensor
 * uses to pick up a row for reordering. When the table is not sorted by the orderable field,
 * this should warn instead of allowing the row to be picked up.
 */
export async function attemptKeyboardReorder(
  page: Page,
  {
    index,
    presses = 1,
    scope,
  }: {
    index: number
    /**
     * Number of times to press Space in a row, to assert that repeated attempts collapse
     * into a single toast instead of stacking a new one per press.
     */
    presses?: number
    scope?: Locator
  },
) {
  const table = (scope || page).locator(`tbody`)
  await table.scrollIntoViewIfNeeded()

  const dragHandle = table.locator(`.sort-row`).nth(index)

  for (let i = 0; i < presses; i++) {
    await dragHandle.press('Space')
  }

  const toast = page.locator('.payload-toast-item.toast-warning')
  await expect(toast).toHaveText(mustSortByOrderMessage)
  await expect(page.locator('.payload-toast-item')).toHaveCount(1)
  await closeAllToasts(page)
}
