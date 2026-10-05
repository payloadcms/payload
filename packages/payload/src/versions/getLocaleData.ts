import type { Field } from '../fields/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { mapLocalizedFields } from './mapLocalizedFields.js'

/** Extract one locale from storage-shaped data without executing field hooks. */
export function getLocaleData({
  data,
  fields,
  locale,
  req,
}: {
  data: JsonObject
  fields: Field[]
  locale: string
  req: PayloadRequest
}): JsonObject {
  return mapLocalizedFields({
    data,
    fields,
    req,
    transform: ({ name, value }) =>
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as JsonObject)[locale]
        : name === '_status'
          ? value
          : undefined,
  })
}

/** Wrap processed localized fields for merging into the storage-shaped document. */
export function wrapLocaleData({
  data,
  fields,
  locale,
  req,
}: {
  data: JsonObject
  fields: Field[]
  locale: string
  req: PayloadRequest
}): JsonObject {
  return mapLocalizedFields({ data, fields, req, transform: ({ value }) => ({ [locale]: value }) })
}
