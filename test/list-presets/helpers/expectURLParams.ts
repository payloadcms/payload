import type { Page } from '@playwright/test'
import type { ColumnPreference, Where } from 'payload'

// import { transformColumnsToSearchParams, transformWhereQuery } from 'payload/shared'
// import * as qs from 'qs-esm'

import { transformColumnsToSearchParams } from 'payload/shared'

export async function expectURLParams({
  page,
  columns,
  where,
  presetID,
}: {
  columns: ColumnPreference[]
  page: Page
  presetID: string | undefined
  where: Where
}) {
  const escapedColumns = encodeURIComponent(JSON.stringify(transformColumnsToSearchParams(columns)))

  // TODO: can't get columns to encode correctly
  // const whereQuery = qs.stringify(transformWhereQuery(where))
  // const encodedWhere = encodeURIComponent(whereQuery)

  const regex = new RegExp(`(?=.*columns=${escapedColumns})(?=.*preset=${presetID})`)

  await page.waitForURL(regex)
}
