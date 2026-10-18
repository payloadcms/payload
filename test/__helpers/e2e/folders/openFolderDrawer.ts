import { expect, type Locator, type Page } from '@playwright/test'

import { POLL_TOPASS_TIMEOUT } from '../../../playwright.config.js'

type Args = {
  /**
   * The drawer expected to open. Defaults to the folder create/edit drawer.
   */
  drawer?: Locator
  /**
   * Performs the interaction that opens the drawer, e.g. clicking "Create folder".
   * Retried while the drawer stays hidden, so it must be safe to repeat.
   */
  openDrawer: () => Promise<void>
  page: Page
  timeout?: number
}

/**
 * Runs `openDrawer` until the folder drawer is visible, then returns its locator.
 *
 * The "Create folder" control is a `div` with a React `onClick`, and Next.js sends
 * it in the server HTML. Playwright can therefore see and click it before React
 * attaches the handler, and that early click does nothing at all. Waiting longer
 * does not help because the click is already gone, so the interaction has to be
 * repeated instead. How long hydration takes depends on how warm the dev server
 * build is, which is why this only shows up on some CI runs.
 */
export async function openFolderDrawer({
  drawer,
  openDrawer,
  page,
  timeout = POLL_TOPASS_TIMEOUT,
}: Args): Promise<Locator> {
  const drawerLocator = drawer ?? page.locator('dialog .collection-edit--payload-folders')

  await expect(async () => {
    if (await drawerLocator.isHidden()) {
      await openDrawer()
    }
    await expect(drawerLocator).toBeVisible()
  }).toPass({ timeout })

  return drawerLocator
}
