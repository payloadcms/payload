import type { Page } from '@playwright/test'

/**
 * Navigate to a list view and wait for the initial redirect to complete.
 *
 * List views redirect from `/admin/collections/X` to `/admin/collections/X?depth=1&limit=10`.
 * This helper ensures the redirect completes before returning, preventing race conditions
 * where interactions happen while the page is being replaced.
 */
export async function navigateToListView({
  page,
  url,
}: {
  page: Page
  url: string
}): Promise<void> {
  await page.goto(url)
  await page.waitForURL((u) => u.searchParams.has('limit'), { timeout: 10000 })
}
