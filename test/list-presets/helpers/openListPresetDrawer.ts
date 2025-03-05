import type { Page } from '@playwright/test'

export async function openListPresetDrawer({ page }: { page: Page }) {
  await page.click('button#select-preset')
}
