import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

export const openListColumns = async (
  page: Page,
  {
    togglerSelector = '.columns-button__button',
    columnContainerSelector = '.popup__content .column-selector',
  }: {
    columnContainerSelector?: string
    togglerSelector?: string
  } = {},
): Promise<{
  columnContainer: Locator
}> => {
  const columnContainer = page.locator(columnContainerSelector).first()

  const isAlreadyOpen = await columnContainer.isVisible()

  if (!isAlreadyOpen) {
    // Scroll toggler to top of viewport before opening so the popup renders
    // below the button and not off the top of the page
    const toggler = page.locator(togglerSelector).first()
    await toggler.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      window.scrollBy({ top: rect.top - 100, behavior: 'instant' })
    })
    await toggler.click()
  }

  await expect(columnContainer).toBeVisible()

  return { columnContainer }
}
