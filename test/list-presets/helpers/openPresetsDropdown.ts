import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

export async function openPresetsDropdown({ page }: { page: Page }) {
  const listPresetsControl = page.locator('.list-presets')
  await listPresetsControl.locator('button.popup-button').click()
  await expect(listPresetsControl.locator('.popup .popup__content')).toBeVisible()
}
