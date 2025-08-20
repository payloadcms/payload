import type { Page } from 'playwright'

export async function assertElementStaysVisible(
  page: Page,
  selector: string,
  durationMs: number = 3000,
  pollIntervalMs: number = 250,
): Promise<void> {
  const start = Date.now()

  // Ensure it appears at least once first
  await page.waitForSelector(selector, { state: 'visible' })

  // Start polling to confirm it stays visible
  while (Date.now() - start < durationMs) {
    const isVisible = await page.isVisible(selector)

    if (!isVisible) {
      throw new Error(`Element "${selector}" disappeared during the visibility duration.`)
    }

    await new Promise((res) => setTimeout(res, pollIntervalMs))
  }

  console.log(`Element "${selector}" remained visible for ${durationMs}ms.`)
}
