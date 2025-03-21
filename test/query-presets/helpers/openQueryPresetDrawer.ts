import type { Page } from '@playwright/test'

export async function openQueryPresetDrawer({ page }: { page: Page }) {
  await page.click('button#select-preset')
}
