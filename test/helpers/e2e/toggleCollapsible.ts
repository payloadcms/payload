import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Works for all collapsible field types, including `collapsible`, `array`, and `blocks`.
 * For arrays and blocks, use the `toggleBlockOrArrayRow` helper instead. It will call this function internally.
 */
export const toggleCollapsible = async ({
  toggler,
  targetState: targetStateFromArgs,
}: {
  targetState?: 'collapsed' | 'open'
  toggler: Locator
}) => {
  const isCollapsedBeforeClick = await toggler.evaluate((el) =>
    el.classList.contains('collapsible__toggle--collapsed'),
  )

  const targetState =
    targetStateFromArgs !== undefined
      ? targetStateFromArgs
      : isCollapsedBeforeClick
        ? 'open'
        : 'collapsed'

  const requiresToggle =
    (isCollapsedBeforeClick && targetState === 'open') ||
    (!isCollapsedBeforeClick && targetState === 'collapsed')

  if (requiresToggle) {
    await toggler.click()
  }

  if (targetState === 'collapsed') {
    await expect(toggler).not.toHaveClass(/collapsible__toggle--open/)
    await expect(toggler).toHaveClass(/collapsible__toggle--collapsed/)
  } else {
    await expect(toggler).toHaveClass(/collapsible__toggle--open/)
    await expect(toggler).not.toHaveClass(/collapsible__toggle--collapsed/)
  }
}

export const toggleBlockOrArrayRow = async ({
  page,
  rowIndex,
  fieldName,
  targetState: targetStateFromArgs,
}: {
  fieldName: string
  page: Page
  rowIndex: number
  targetState?: 'collapsed' | 'open'
}) => {
  const row = page.locator(`#${fieldName}-row-${rowIndex}`)

  const toggler = row.locator('button.collapsible__toggle')

  await toggleCollapsible({ toggler, targetState: targetStateFromArgs })
}
