import type { Endpoint, Field, SanitizedCollectionConfig } from 'payload'

/**
 * Returns a normalised description of every collection so the Ovok Dashboard
 * can render Payload-style CRUD forms without bundling Payload's admin UI.
 *
 * Reachable from outside the cluster via the Ovok proxy:
 *   GET /v1/content/_ovok/schema
 *
 * Direct access (inside the cluster, with internal-key header):
 *   GET /_ovok/schema
 */

interface NormalisedField {
  name: string
  type: string
  label: string | null
  required: boolean
  unique: boolean
  hasMany?: boolean
  relationTo?: string | string[]
  options?: Array<{ label: string; value: string }>
  fields?: NormalisedField[]
  description: string | null
}

interface NormalisedCollection {
  slug: string
  labels: { singular: string; plural: string }
  upload: boolean
  auth: boolean
  fields: NormalisedField[]
}

const stringifyLabel = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  return null
}

const normaliseField = (field: Field): NormalisedField | null => {
  const anyField = field as Record<string, unknown> & { type: string; name?: string }
  if (!anyField.name && !['row', 'collapsible', 'tabs', 'ui'].includes(anyField.type)) {
    return null
  }

  const base: NormalisedField = {
    name: (anyField.name as string) ?? anyField.type,
    type: anyField.type,
    label: stringifyLabel((anyField as { label?: unknown }).label),
    required: Boolean((anyField as { required?: boolean }).required),
    unique: Boolean((anyField as { unique?: boolean }).unique),
    description: stringifyLabel(((anyField as { admin?: { description?: unknown } }).admin ?? {}).description),
  }

  if (anyField.type === 'relationship' || anyField.type === 'upload') {
    base.relationTo = (anyField as { relationTo?: string | string[] }).relationTo
    base.hasMany = Boolean((anyField as { hasMany?: boolean }).hasMany)
  }

  if (anyField.type === 'select') {
    const rawOptions =
      (anyField as { options?: Array<string | { label: string; value: string }> }).options ?? []
    base.options = rawOptions.map((o) => (typeof o === 'string' ? { label: o, value: o } : o))
    base.hasMany = Boolean((anyField as { hasMany?: boolean }).hasMany)
  }

  if (['array', 'group', 'blocks'].includes(anyField.type)) {
    const subFields = ((anyField as { fields?: Field[] }).fields ?? [])
      .map(normaliseField)
      .filter((f): f is NormalisedField => f !== null)
    base.fields = subFields
  }

  return base
}

const normaliseCollection = (collection: SanitizedCollectionConfig): NormalisedCollection => ({
  slug: collection.slug,
  labels: {
    singular: stringifyLabel(collection.labels?.singular) ?? collection.slug,
    plural: stringifyLabel(collection.labels?.plural) ?? collection.slug,
  },
  upload: Boolean(collection.upload),
  auth: Boolean(collection.auth),
  fields: collection.fields
    .map(normaliseField)
    .filter((f): f is NormalisedField => f !== null),
})

export const schemaEndpoint: Endpoint = {
  path: '/_ovok/schema',
  method: 'get',
  handler: async ({ payload }) => {
    const collections = Object.values(payload.collections)
      .filter(({ config }) => config.slug !== 'tenants' && config.slug !== 'users')
      .map(({ config }) => normaliseCollection(config))

    return Response.json({ collections })
  },
}
