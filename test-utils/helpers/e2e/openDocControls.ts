import { expect, type Locator, type Page } from '@playwright/test'

export async function openDocControls(page: Locator | Page): Promise<void> {
  await page.locator('.doc-controls__popup >> .popup-button').click()
  await expect(page.locator('.doc-controls__popup >> .popup__content')).toBeVisible()
}
