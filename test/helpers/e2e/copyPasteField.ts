import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { wait } from 'payload/shared'

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

  let popupBtn: Locator

  if (rowAction) {
    const formattedRowID = fieldName.replace(/__/g, '.')
    const rowSuffix = `${formattedRowID}-row-${rowIndex}`
    const row = field.locator(`:is([id$="-${rowSuffix}"], [id$="${rowSuffix}"])`).first()
    popupBtn = row.locator('.collapsible__actions button.array-actions__button').first()
  } else {
    popupBtn = field.locator('header .clipboard-action__popup button.popup-button').first()
  }
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
  }
}
