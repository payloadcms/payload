import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { exactText } from '../../helpers.js'

export const openListColumns = async (
  page: Page,
  {
    togglerSelector = '.list-controls__toggle-columns',
    columnContainerSelector = '.list-controls__columns',
  }: {
    columnContainerSelector?: string
    togglerSelector?: string
  },
): Promise<any> => {
  const columnContainer = page.locator(columnContainerSelector).first()
  const isAlreadyOpen = await columnContainer.isVisible()

  if (!isAlreadyOpen) {
    await page.locator(togglerSelector).first().click()
  }

  await expect(page.locator(`${columnContainerSelector}.rah-static--height-auto`)).toBeVisible()

  return columnContainer
}

export const toggleColumn = async (
  page: Page,
  {
    togglerSelector,
    columnContainerSelector,
    columnLabel,
  }: {
    columnContainerSelector?: string
    columnLabel: string
    togglerSelector?: string
  },
): Promise<any> => {
  const columnContainer = await openListColumns(page, { togglerSelector, columnContainerSelector })

  const column = columnContainer.locator(`.column-selector .column-selector__column`, {
    hasText: exactText(columnLabel),
  })

  const isActiveBeforeClick = await column.evaluate((el) =>
    el.classList.contains('column-selector__column--active'),
  )

  await expect(column).toBeVisible()

  await column.click()

  if (isActiveBeforeClick) {
    // no class
    await expect(column).not.toHaveClass('column-selector__column--active')
  } else {
    // has class
    await expect(column).toHaveClass('column-selector__column--active')
  }

  return column
}
