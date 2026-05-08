import type { Column, ListViewSlots } from '@payloadcms/ui'

import { mergeListSearchAndWhere } from '@payloadcms/ui/shared'
import { headersWithCors, mergeHeaders } from '@payloadcms/next/utilities'

export type Args = {
  column: Column
  slots: ListViewSlots
}

export const buildHeaders = (a: Headers, b: Headers) => mergeHeaders(a, b)
export const cors = headersWithCors
export const buildWhere = mergeListSearchAndWhere
