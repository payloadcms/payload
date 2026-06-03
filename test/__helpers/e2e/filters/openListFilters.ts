import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Opens the list filters drawer in the list view. If it's already open, does nothing.
 * Return the filter container locator for further interactions.
 */
export const openListFilters = async (
  page: Page,
  {
    togglerSelector = '#toggle-list-filters',
    filterContainerSelector = '#list-controls-where',
  }: {
    filterContainerSelector?: string
    togglerSelector?: string
  },
): Promise<{
  filterContainer: Locator
}> => {
  const toggler = page.locator(togglerSelector).first()
  await expect(toggler).toBeVisible()

  const openContainer = page.locator(`${filterContainerSelector}.rah-static--height-auto`)

  // Drive the drawer open off the toggler's `aria-expanded` state (the source of truth)
  // rather than a point-in-time visibility check of the container. The container's "open"
  // class lingers during the close animation and flickers visible mid-open, so keying the
  // toggle decision off container visibility could either skip the click while the panel is
  // mid-close or drop the open click before React updates state (e.g. after a group-by/sort
  // re-render). We click only when `aria-expanded` reports closed, then retry until the
  // container is actually open. This makes the helper idempotent and resilient to that race.
  await expect(async () => {
    if ((await toggler.getAttribute('aria-expanded')) !== 'true') {
      await toggler.click()
    }

    await expect(toggler).toHaveAttribute('aria-expanded', 'true')
    await expect(openContainer).toBeVisible()
  }).toPass()

  return { filterContainer: page.locator(filterContainerSelector).first() }
}
