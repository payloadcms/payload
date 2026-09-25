import type { Page } from '@playwright/test'

const HIDE_DEV_TOOLS_SCRIPT = `
  // Inject CSS to hide Next.js dev tools indicator
  function injectHideStyles() {
    const style = document.createElement('style');
    style.id = 'hide-nextjs-devtools';
    style.textContent = \`
      [data-nextjs-dialog-overlay],
      [data-nextjs-toast],
      #__next-build-indicator,
      #nextjs-dev-tools-menu,
      .dev-tools-indicator,
      [class*="dev-tools-indicator"],
      button#next-logo,
      nextjs-portal {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    \`;
    (document.head || document.documentElement).appendChild(style);
  }

  // Run when DOM is ready
  if (document.head || document.documentElement) {
    injectHideStyles();
  } else {
    document.addEventListener('DOMContentLoaded', injectHideStyles);
  }
`

/**
 * Sets up automatic hiding of Next.js dev tools for all navigations.
 * Call this once per page/test context (e.g., in beforeEach or test setup).
 * Uses addInitScript so the CSS is injected before any page scripts run.
 */
export const hideNextDevTools = async (page: Page): Promise<void> => {
  await page.addInitScript(HIDE_DEV_TOOLS_SCRIPT)
}
