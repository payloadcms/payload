import type { Page } from '@playwright/test'
import type { ColumnPreference, Where } from 'payload'

// import { transformColumnsToSearchParams, transformWhereQuery } from 'payload/shared'
// import * as qs from 'qs-esm'

import { transformColumnsToSearchParams } from 'payload/shared'

export async function assertURLParams({
  page,
  columns,
  where,
  preset,
}: {
  columns?: ColumnPreference[]
  page: Page
  preset?: string | undefined
  where?: Where
}) {
  if (where) {
    // TODO: can't get columns to encode correctly
    // const whereQuery = qs.stringify(transformWhereQuery(where))
    // const encodedWhere = encodeURIComponent(whereQuery)
  }

  if (columns) {
    const escapedColumns = encodeURIComponent(
      JSON.stringify(transformColumnsToSearchParams(columns)),
    )

    const columnsRegex = new RegExp(`columns=${escapedColumns}`)
    await page.waitForURL(columnsRegex)
  }

  if (preset) {
    const presetRegex = new RegExp(`preset=${preset}`)
    await page.waitForURL(presetRegex)
  }
}
