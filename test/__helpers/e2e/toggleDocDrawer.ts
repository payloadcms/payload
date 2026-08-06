import type { Page } from '@playwright/test'

import { wait } from 'payload/shared'

import { waitForFormReady } from './helpers.js'

export async function openDocDrawer({
  page,
  selector,
  withMetaKey = false,
}: {
  page: Page
  selector: string
  withMetaKey?: boolean
}): Promise<void> {
  let clickProperties = {}
  if (withMetaKey) {
    clickProperties = { modifiers: ['ControlOrMeta'] }
  }
  await waitForFormReady(page)
  await page.locator(selector).click(clickProperties)
  await waitForFormReady(page)
}
