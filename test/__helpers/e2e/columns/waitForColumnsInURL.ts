import type { Page } from 'playwright'

export const waitForColumnInURL = async ({
  page,
  columnName,
  state,
}: {
  columnName: string
  page: Page
  state: 'off' | 'on'
}): Promise<void> => {
  await page.waitForURL(/.*\?.*/)

  const identifier = `${state === 'off' ? '-' : ''}${columnName}`

  // Test that the identifier is in the URL
  // It must appear in the `columns` query parameter, i.e. after `columns=...` and before the next `&`
  // It must also appear in it entirety to prevent partially matching other values, i.e. between quotation marks
  const regex = new RegExp(`columns=([^&]*${encodeURIComponent(`"${identifier}"`)}[^&]*)`)

  await page.waitForURL(regex)
}
