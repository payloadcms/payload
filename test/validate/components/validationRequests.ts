import type { ClientField, Data, ValidationResult } from 'payload'

import { formatAdminURL } from 'payload/shared'

/**
 * A locale-scoped validate call carries one flat candidate. Localized field values
 * belong only to the active locale being edited, so they must be stripped before the
 * same candidate is used to validate any other locale.
 */
export function stripLocalizedFields({
  data,
  fields,
}: {
  data: Data
  fields: ClientField[]
}): Data {
  const projectedData = { ...data }

  for (const field of fields) {
    if ('name' in field && 'localized' in field && field.localized) {
      delete projectedData[field.name]
    }
  }

  return projectedData
}

export function getValidateEndpoint({
  id,
  apiRoute,
  collectionSlug,
  globalSlug,
}: {
  apiRoute: string
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
}): string {
  const path: `/${string}` = globalSlug
    ? `/globals/${globalSlug}/validate`
    : `/${collectionSlug}${id ? `/${id}` : ''}/validate`

  return formatAdminURL({ apiRoute, path })
}

export async function requestValidation({
  body,
  endpoint,
  locales,
}: {
  body: Data
  endpoint: string
  locales: string[]
}): Promise<ValidationResult> {
  const search = new URLSearchParams()

  for (const locale of locales) {
    search.append('locale', locale)
  }

  const response = await fetch(`${endpoint}?${search.toString()}`, {
    body: JSON.stringify(body),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  return (await response.json()) as ValidationResult
}
