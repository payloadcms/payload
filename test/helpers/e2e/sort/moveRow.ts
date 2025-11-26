import type { Page } from 'playwright'

import { expect } from 'playwright/test'

export async function moveRow(
  page: Page,
  {
    fromIndex,
    toIndex,
    expected = 'success',
    nthTable = 0,
  }: { expected?: 'success' | 'warning'; fromIndex: number; nthTable?: number; toIndex: number },
) {
  // counting from 1, zero excluded
  const table = page.locator(`tbody`).nth(nthTable)
  const dragHandle = table.locator(`.sort-row`)
  const source = dragHandle.nth(fromIndex - 1)
  const target = dragHandle.nth(toIndex - 1)

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
  }
}
