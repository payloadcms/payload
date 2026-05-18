import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { exactText } from '__helpers/e2e/helpers.js'
import { TEST_TIMEOUT_LONG } from 'playwright.config.js'

export async function selectPreset({ page, presetTitle }: { page: Page; presetTitle: string }) {
  // Click the preset dropdown to open the popup
  await page.click('#select-preset')

  // Wait for popup to be visible
  const popup = page.locator('.popup__content')
  await expect(popup).toBeVisible()

  const currentURL = page.url()

  // Click on the preset in the popup list
  await popup
    .locator('.popup-button-list__button', {
      hasText: exactText(presetTitle),
    })
    .first()
    .click()

  await page.waitForURL(() => page.url() !== currentURL)

  await expect(
    page.locator('#select-preset', {
      hasText: exactText(presetTitle),
    }),
  ).toBeVisible()
}

export async function clearSelectedPreset({ page }: { page: Page }) {
  const clearButton = page.locator('.query-preset-bar__clear')

  // Wait for the clear button to be visible and click it
  await expect(clearButton).toBeVisible()
  await clearButton.click()

  // Wait for preset parameter to be cleared from URL
  // Other params like columns, groupBy may be temporarily empty strings before being removed
  const regex = /preset=/
  await page.waitForURL((url) => !regex.test(url.search), {
    timeout: TEST_TIMEOUT_LONG,
  })

  await expect(page.locator('.query-preset-bar__clear')).toBeHidden()

  await expect(
    page.locator('#select-preset', {
      hasText: exactText('Select Preset'),
    }),
  ).toBeVisible()
}

/**
 * Opens the popup and clicks "Create New Preset"
 */
export async function openCreatePreset({ page }: { page: Page }) {
  await page.click('#select-preset')
  const popup = page.locator('.popup__content')
  await expect(popup).toBeVisible()
  await popup.locator('#create-new-preset').click()
}

/**
 * Opens the popup and clicks "Edit Preset" (only visible when a preset is selected)
 */
export async function openEditPreset({ page }: { page: Page }) {
  await page.click('#select-preset')
  const popup = page.locator('.popup__content')
  await expect(popup).toBeVisible()
  await popup.locator('#edit-preset').click()
}

/**
 * Opens the popup and clicks "Delete Preset" (only visible when a preset is selected)
 */
export async function openDeletePreset({ page }: { page: Page }) {
  await page.click('#select-preset')
  const popup = page.locator('.popup__content')
  await expect(popup).toBeVisible()
  await popup.locator('#delete-preset').click()
}

/**
 * Opens the popup and clicks "Reset" to revert changes (only visible when preset is modified)
 */
export async function resetPresetChanges({ page }: { page: Page }) {
  await page.click('#select-preset')
  const popup = page.locator('.popup__content')
  await expect(popup).toBeVisible()
  await popup.locator('#reset-preset').click()
}

/**
 * Opens the popup and clicks "Save changes" (only visible when preset is modified)
 */
export async function savePresetChanges({ page }: { page: Page }) {
  await page.click('#select-preset')
  const popup = page.locator('.popup__content')
  await expect(popup).toBeVisible()
  await popup.locator('#save-preset').click()
}

/**
 * Check if reset/save options are visible in the popup menu
 */
export async function checkPresetModifiedOptions({
  page,
  expectReset,
  expectSave,
}: {
  expectReset: boolean
  expectSave: boolean
  page: Page
}) {
  await page.click('#select-preset')
  const popup = page.locator('.popup__content')
  await expect(popup).toBeVisible()

  const resetButton = popup.locator('#reset-preset')
  const saveButton = popup.locator('#save-preset')

  if (expectReset) {
    await expect(resetButton).toBeVisible()
  } else {
    await expect(resetButton).toBeHidden()
  }

  if (expectSave) {
    await expect(saveButton).toBeVisible()
  } else {
    await expect(saveButton).toBeHidden()
  }

  // Close the popup by pressing Escape
  await page.keyboard.press('Escape')
}

/**
 * Opens the popup and clicks "Manage Presets" to open the list drawer
 */
export async function openManagePresets({ page }: { page: Page }) {
  await page.click('#select-preset')
  const popup = page.locator('.popup__content')
  await expect(popup).toBeVisible()
  await popup.locator('#manage-presets').click()
}

/**
 * Check if edit/delete options are visible in the popup menu
 */
export async function checkPresetMenuOptions({
  page,
  expectEdit,
  expectDelete,
}: {
  expectDelete: boolean
  expectEdit: boolean
  page: Page
}) {
  await page.click('#select-preset')
  const popup = page.locator('.popup__content')
  await expect(popup).toBeVisible()

  const editButton = popup.locator('#edit-preset')
  const deleteButton = popup.locator('#delete-preset')

  if (expectEdit) {
    await expect(editButton).toBeVisible()
  } else {
    await expect(editButton).toBeHidden()
  }

  if (expectDelete) {
    await expect(deleteButton).toBeVisible()
  } else {
    await expect(deleteButton).toBeHidden()
  }

  // Close the popup by pressing Escape
  await page.keyboard.press('Escape')
}
