import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

export async function openQueryPresetDrawer({ page }: { page: Page }): Promise<Locator> {
  // Wait for the initial redirect to complete (URL should contain limit param)
  await page.waitForURL((url) => url.searchParams.has('limit'), { timeout: 10000 })

  // Click the preset dropdown to open the popup
  await page.click('#select-preset')

  // Wait for popup to be visible
  const popup = page.locator('.popup__content')
  await expect(popup).toBeVisible()

  // Click "Manage Presets" to open the drawer
  await popup.locator('.popup-button-list__button', { hasText: /Manage/i }).click()

  const drawer = page.locator('dialog[id^="list-drawer_0_"]')
  await expect(drawer).toBeVisible()
  await expect(drawer.locator('.collection-list--payload-query-presets')).toBeVisible()
  return drawer
}
