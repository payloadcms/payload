import type { Page } from '@playwright/test'

export async function navigateToListCellLink(page: Page, selector = '.cell-id') {
  const cellLink = page.locator(`${selector} a`).first()
  const linkURL = await cellLink.getAttribute('href')
  await cellLink.click()
  await page.waitForURL(`**${linkURL}`)
}
