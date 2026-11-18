import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

const listRowsSelector = '.collection-list table > tbody > tr'
const linkedDocumentSelector = '.cell--linked a'

export type OpenListDocumentArgs = {
  index?: number
  page: Page
}

const formatListDocumentContext = ({
  availableCount,
  index,
  page,
}: {
  availableCount: number
  index: number
  page: Page
}): string => {
  const validIndexes = availableCount === 0 ? 'none' : `0-${availableCount - 1}`

  return [
    `Could not open list document at index ${index}.`,
    `Current URL: ${page.url()}`,
    `List row selector: ${listRowsSelector}`,
    `Requested index: ${index}`,
    `Available rows: ${availableCount}`,
    `Valid indexes: ${validIndexes}`,
  ].join('\n')
}

export const openListDocument = async ({
  index = 0,
  page,
}: OpenListDocumentArgs): Promise<void> => {
  const rows = page.locator(listRowsSelector)
  const availableCount = await rows.count()
  const canSelectIndex = Number.isInteger(index) && index >= 0
  const row = rows.nth(canSelectIndex ? index : availableCount)
  const context = formatListDocumentContext({ availableCount, index, page })

  await expect(row, context).toHaveCount(1)

  const documentLink = row.locator(linkedDocumentSelector)
  const availableLinkCount = await documentLink.count()

  await expect(
    documentLink,
    [
      context,
      `Linked document selector: ${linkedDocumentSelector}`,
      `Available linked document links in row: ${availableLinkCount}`,
    ].join('\n'),
  ).toHaveCount(1)

  const href = await documentLink.getAttribute('href')

  await expect(documentLink, context).toHaveAttribute('href', /.+/)

  const destinationURL = new URL(href as string, page.url()).href

  await documentLink.click()
  await expect(page, `Expected list document ${index} to open ${destinationURL}.`).toHaveURL(
    destinationURL,
  )
}
