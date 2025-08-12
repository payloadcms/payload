import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

export async function openQueryPresetDrawer({ page }: { page: Page }): Promise<Locator> {
  await page.click('button#select-preset')
  const drawer = page.locator('dialog[id^="list-drawer_0_"]')
  await expect(drawer).toBeVisible()
  await expect(drawer.locator('.collection-list--payload-query-presets')).toBeVisible()
  return drawer
}
