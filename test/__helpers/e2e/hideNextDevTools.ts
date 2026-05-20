import type { Page } from '@playwright/test'

/**
 * Hides the Next.js dev tools indicator that can intercept pointer events during tests.
 * This clicks through the menu: Logo button → Preferences → Hide
 * Skips silently if the indicator is not present or visible.
 */
export const hideNextDevTools = async (page: Page): Promise<void> => {
  const devToolsButton = page.locator('#next-logo')

  // Only proceed if the dev tools button exists and is visible
  if ((await devToolsButton.count()) === 0 || !(await devToolsButton.isVisible())) {
    return
  }

  // Click the Next.js logo button to open the menu
  await devToolsButton.click({ force: true })

  // Click Preferences menu item
  const preferencesItem = page.locator('.dev-tools-indicator-item[data-preferences="true"]')
  await preferencesItem.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
  if ((await preferencesItem.count()) > 0 && (await preferencesItem.isVisible())) {
    await preferencesItem.click({ force: true })
  }

  // Click Hide button
  const hideButton = page.locator('button[data-hide-dev-tools="true"]')
  await hideButton.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
  if ((await hideButton.count()) > 0 && (await hideButton.isVisible())) {
    await hideButton.click({ force: true })
  }
}
