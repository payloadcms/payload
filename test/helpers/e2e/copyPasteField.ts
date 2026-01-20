import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { wait } from 'payload/shared'

import { closeAllToasts } from '../../helpers.js'

export async function copyPasteField({
  fieldName,
  rowIndex,
  page,
  action = 'copy',
}: {
  action?: 'copy' | 'paste'
  fieldName: string
  page: Page
  rowIndex?: number
}) {
  const isCopy = action === 'copy'
  const field = page.locator(`#field-${fieldName}`)
  const rowAction = typeof rowIndex === 'number'
  await expect(field).toBeVisible()

  if (rowAction) {
    await wait(1000)
  }

  const popupBtnSelector = rowAction
    ? `#${fieldName}-row-${rowIndex} .collapsible__actions button.array-actions__button`
    : 'header .clipboard-action__popup button.popup-button'
  const popupBtn = field.locator(popupBtnSelector).first()
  await expect(popupBtn).toBeVisible()
  await popupBtn.click()

  const actionBtnSelector = rowAction
    ? `.popup__content .popup-button-list button.array-actions__${action}`
    : `.popup__content .popup-button-list button:has-text("${isCopy ? 'Copy' : 'Paste'} Field")`
  const actionBtn = page.locator(actionBtnSelector).first()
  await expect(actionBtn).toBeVisible()
  await actionBtn.click()

  if (isCopy) {
    const copySuccessToast = page.locator('.payload-toast-item.toast-success')
    await expect(copySuccessToast).toBeVisible()
    await closeAllToasts(page)
  }
}
