import type { ClientCollectionConfig, ClientField, ClientGlobalConfig } from 'payload'

/**
 * Walks a client entity config (collection or global) to find the ClientField
 * at the given form-state-relative path. Numeric path segments (array/block
 * row indices) are skipped — they don't appear in the schema. Containers
 * without a name (`row`, `collapsible`) descend transparently.
 *
 * Phase 13.x: client-mounted Field components routed through the dispatch
 * fast-path receive `field` as a prop so wrappers around base @payloadcms/ui
 * field components (TextField, NumberField, etc.) don't crash destructuring
 * `admin` from undefined. The legacy server-render path bakes this in via
 * `RenderServerComponent.clientProps`; this helper replicates the lookup on
 * the client.
 */
export function findClientFieldAtPath(
  entityConfig: ClientCollectionConfig | ClientGlobalConfig | null | undefined,
  path: string,
): ClientField | undefined {
  if (!entityConfig?.fields?.length) {
    return undefined
  }
  return walk(
    entityConfig.fields,
    path.split('.').filter((seg) => !/^\d+$/.test(seg)),
  )
}

function walk(fields: ClientField[], segments: string[]): ClientField | undefined {
  if (segments.length === 0) {
    return undefined
  }
  const [head, ...tail] = segments
  for (const field of fields) {
    if ('name' in field && field.name === head) {
      if (tail.length === 0) {
        return field
      }
      const childFields = extractChildFields(field)
      return childFields ? walk(childFields, tail) : undefined
    }
    // Containers without a name (row, collapsible) — descend transparently.
    if (
      (field.type === 'row' || field.type === 'collapsible') &&
      'fields' in field &&
      Array.isArray(field.fields)
    ) {
      const nested = walk(field.fields, segments)
      if (nested) {
        return nested
      }
    }
  }
  return undefined
}

function extractChildFields(field: ClientField): ClientField[] | undefined {
  if ('fields' in field && Array.isArray((field as { fields?: ClientField[] }).fields)) {
    return (field as { fields: ClientField[] }).fields
  }
  return undefined
}
