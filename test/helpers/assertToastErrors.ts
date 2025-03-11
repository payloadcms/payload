import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

export async function assertToastErrors({
  page,
  errors,
}: {
  errors: string[]
  page: Page
}): Promise<void> {
  const message =
    errors.length === 1
      ? 'The following field is invalid:'
      : `The following fields are invalid (${errors.length}):`
  await expect(
    page.locator('.payload-toast-container li').filter({ hasText: message }),
  ).toBeVisible()
  for (let i = 0; i < errors.length; i++) {
    const error = errors[i]
    if (error) {
      await expect(
        page.locator('.payload-toast-container [data-testid="field-errors"] li').nth(i),
      ).toHaveText(error)
    }
  }
}
