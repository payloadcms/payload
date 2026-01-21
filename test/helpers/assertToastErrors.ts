import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { closeAllToasts } from '../helpers.js'

export async function assertToastErrors({
  page,
  errors,
}: {
  errors: string[]
  page: Page
}): Promise<void> {
  const isSingleError = errors.length === 1
  const message = isSingleError
    ? 'The following field is invalid: '
    : `The following fields are invalid (${errors.length}):`

  // Check the intro message text
  await expect(page.locator('.payload-toast-container')).toContainText(message)

  // Check single error
  if (isSingleError) {
    await expect(page.locator('.payload-toast-container [data-testid="field-error"]')).toHaveText(
      errors[0]!,
    )
  } else {
    // Check multiple errors
    const errorItems = page.locator('.payload-toast-container [data-testid="field-errors"] li')
    for (let i = 0; i < errors.length; i++) {
      await expect(errorItems.nth(i)).toHaveText(errors[i]!)
    }
  }

  await closeAllToasts(page)
}
