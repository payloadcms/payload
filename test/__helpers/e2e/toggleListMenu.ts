import type { Page } from '@playwright/test'

import { testIds } from '@payloadcms/ui/shared'
import { expect } from '@playwright/test'

import { exactText } from './helpers.js'

export async function openListMenu({ page }: { page: Page }) {
  const listMenu = page.getByTestId(testIds.list.menu)
  await listMenu.locator('button.popup-button').click()
  await expect(page.getByTestId(testIds.popup.content)).toBeVisible()
}

export async function clickListMenuItem({
  page,
  menuItemLabel,
}: {
  menuItemLabel: string
  page: Page
}) {
  const menuItem = page.getByTestId(testIds.popup.content).locator('button', {
    hasText: exactText(menuItemLabel),
  })

  await menuItem.click()
}
