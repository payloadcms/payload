import type { Page } from '@playwright/test'

/**
 * Disables pointer events on the Next.js dev tools overlay during tests.
 * This prevents the overlay from intercepting clicks on page controls.
 * Uses CSS injection instead of clicking "Hide" so preferences don't persist.
 */
export const hideNextDevTools = async (page: Page): Promise<void> => {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-dev-overlay],
      #__next-build-indicator {
        pointer-events: none !important;
      }
    `,
  })
}
