import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { exactText } from 'helpers.js'

import { openListPresetDrawer } from './openListPresetDrawer.js'

export async function selectPreset({ page, presetTitle }: { page: Page; presetTitle: string }) {
  await openListPresetDrawer({ page })
  const modal = page.locator('[id^=list-drawer_0_]')
  await expect(modal).toBeVisible()

  await modal
    .locator('tbody tr td button', {
      hasText: exactText(presetTitle),
    })
    .click()

  await expect(
    page.locator('button#select-preset', {
      hasText: exactText(presetTitle),
    }),
  ).toBeVisible()
}

export async function clearSelectedPreset({ page }: { page: Page }) {
  const listPresetsControl = page.locator('button#select-preset')
  const clearButton = listPresetsControl.locator('#clear-preset')

  if (await clearButton.isVisible()) {
    await clearButton.click()
  }

  const regex = /columns=/
  await page.waitForURL((url) => !regex.test(url.search))
  await expect(listPresetsControl.locator('#clear-preset')).toBeHidden()

  await expect(
    page.locator('button#select-preset', {
      hasText: exactText('Select Preset'),
    }),
  ).toBeVisible()
}
