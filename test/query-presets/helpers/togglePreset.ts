import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { exactText } from 'helpers.js'
import { TEST_TIMEOUT_LONG } from 'playwright.config.js'

import { openQueryPresetDrawer } from './openQueryPresetDrawer.js'

export async function selectPreset({ page, presetTitle }: { page: Page; presetTitle: string }) {
  await openQueryPresetDrawer({ page })
  const modal = page.locator('[id^=list-drawer_0_]')
  await expect(modal).toBeVisible()

  const currentURL = page.url()

  await modal
    .locator('tbody tr td button', {
      hasText: exactText(presetTitle),
    })
    .first()
    .click()

  await page.waitForURL(() => page.url() !== currentURL)

  await expect(
    page.locator('button#select-preset', {
      hasText: exactText(presetTitle),
    }),
  ).toBeVisible()
}

export async function clearSelectedPreset({ page }: { page: Page }) {
  const queryPresetsControl = page.locator('button#select-preset')
  const clearButton = queryPresetsControl.locator('#clear-preset')

  if (await clearButton.isVisible()) {
    await clearButton.click()
  }

  const regex = /columns=/

  await page.waitForURL((url) => !regex.test(url.search), {
    timeout: TEST_TIMEOUT_LONG,
  })

  await expect(queryPresetsControl.locator('#clear-preset')).toBeHidden()

  await expect(
    page.locator('button#select-preset', {
      hasText: exactText('Select Preset'),
    }),
  ).toBeVisible()
}
