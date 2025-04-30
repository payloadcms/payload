import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { exactText } from 'helpers.js'

export async function openListMenu({ page }: { page: Page }) {
  const listMenu = page.locator('#list-menu')
  await listMenu.locator('button.popup-button').click()
  await expect(listMenu.locator('.popup__content')).toBeVisible()
}

export async function clickListMenuItem({
  page,
  menuItemLabel,
}: {
  menuItemLabel: string
  page: Page
}) {
  await openListMenu({ page })

  const menuItem = page.locator('.popup__content').locator('button', {
    hasText: exactText(menuItemLabel),
  })

  await menuItem.click()
}
