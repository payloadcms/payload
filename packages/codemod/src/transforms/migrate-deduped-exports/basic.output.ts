import type { Column, ListViewSlots } from 'payload'

import { mergeListSearchAndWhere } from 'payload/shared'
import { headersWithCors, mergeHeaders } from 'payload'

export type Args = {
  column: Column
  slots: ListViewSlots
}

export const buildHeaders = (a: Headers, b: Headers) => mergeHeaders(a, b)
export const cors = headersWithCors
export const buildWhere = mergeListSearchAndWhere
