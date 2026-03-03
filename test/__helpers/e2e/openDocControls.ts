import { testIds } from '@payloadcms/ui/shared'
import { expect, type Locator, type Page } from '@playwright/test'

export async function openDocControls(
  page: Locator | Page,
  mainPage?: Locator | Page,
): Promise<void> {
  await page.getByTestId(testIds.docControls.menu).click()
  await expect((mainPage ?? page).locator('.popup__content')).toBeVisible()
}
