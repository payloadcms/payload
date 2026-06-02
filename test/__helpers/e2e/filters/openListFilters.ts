import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Opens the list filters drawer in the list view. If it's already open, does nothing.
 * Return the filter container locator for further interactions.
 *
 * Uses `expect.toPass` to retry the click. In dev/SSR setups (notably the
 * TanStack Start tests) the very first click can land on the SSR'd button
 * before React has finished hydrating, so the `onClick` handler isn't yet
 * attached and the drawer never opens. Retrying the click until the expanded
 * marker class appears is much more reliable than a one-shot click + assert.
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

  // Drive the drawer open off the toggler's `aria-expanded` state (the source of truth)
  // rather than a point-in-time visibility check of the container. The container flickers
  // visible mid-animation, and a preceding re-render (e.g. a group-by/sort change) can drop
  // the open click before it updates React state. Retrying the toggle until `aria-expanded`
  // reports open makes this idempotent and resilient to that race.
  //
  // The `toPass` outer wrapper also handles the dev/SSR case (notably the TanStack Start
  // tests) where the very first click can land on the SSR'd button before React has finished
  // hydrating and the `onClick` handler hasn't attached yet.
  await expect(async () => {
    if ((await toggler.getAttribute('aria-expanded')) !== 'true') {
      await toggler.click()
    }

    await expect(toggler).toHaveAttribute('aria-expanded', 'true', { timeout: 1500 })
  }).toPass({ timeout: 18000 })

  await expect(page.locator(`${filterContainerSelector}.rah-static--height-auto`)).toBeVisible()

  return { filterContainer: page.locator(filterContainerSelector).first() }
}
