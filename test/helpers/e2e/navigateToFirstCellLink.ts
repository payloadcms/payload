import type { Page } from '@playwright/test'

export async function navigateToListCellLink(page: Page) {
  const cellLink = page.locator(`tbody tr:first-child td a`).first()
  const linkURL = await cellLink.getAttribute('href')
  await cellLink.click()
  await page.waitForURL(`**${linkURL}`)
}
