import type { JsonObject } from 'payload'

/** Managed version content is writable only through the generation-guarded adapter boundary. */
export const guardLegacyVersionUpdate = ({
  data,
  query,
}: {
  data: JsonObject
  query: Record<string, unknown>
}): Record<string, unknown> => {
  for (const key of Object.keys(data)) {
    if (key.startsWith('$') || /^branch(?:Generation|Frozen|OwnerKey|Only)(?:\.|$)/.test(key)) {
      throw new Error('Branch version metadata cannot be written through legacy version updates.')
    }
  }

  const keys = Object.keys(data)

  if (keys.length === 1 && keys[0] === 'latest' && typeof data.latest === 'boolean') {
    return query
  }

  return { $and: [query, { branchGeneration: { $exists: false } }] }
}
