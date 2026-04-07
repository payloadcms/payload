import type { Page } from '@playwright/test'

export const applyBrowseByFolderTypeFilter = async ({
  page,
  type,
  on,
}: {
  on: boolean
  page: Page
  type: {
    label: string
    value: string
  }
}) => {
  // Check if the popup is already active
  let typePill = page.locator('.search-bar__actions .checkbox-popup.popup--active', {
    hasText: 'Type',
  })
  const isActive = (await page.locator('.popup__content').count()) > 0

  if (!isActive) {
    typePill = page.locator('.search-bar__actions .checkbox-popup', { hasText: 'Type' })
    await typePill.locator('.popup-button', { hasText: 'Type' }).click()
  }

  await page.locator('.popup__content .field-label', { hasText: type.label }).click()

  await page.waitForURL((urlStr) => {
    try {
      const url = new URL(urlStr)
      const relationTo = url.searchParams.get('relationTo')
      if (on) {
        return Boolean(relationTo?.includes(`"${type.value}"`))
      } else {
        return Boolean(!relationTo?.includes(`"${type.value}"`))
      }
    } catch {
      return false
    }
  })
}
