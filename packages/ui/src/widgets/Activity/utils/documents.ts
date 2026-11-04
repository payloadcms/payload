import type { PinnedDocument } from 'payload'

export type DocumentReference = PinnedDocument

export const documentKey = ({ id, collectionSlug }: DocumentReference): string =>
  `${collectionSlug}:${String(id)}`

export function getValueByPath({
  object,
  path,
}: {
  object: Record<string, unknown>
  path: string
}): unknown {
  if (!path) {
    return undefined
  }

  return path.split('.').reduce<unknown>((value, segment) => {
    if (!value || typeof value !== 'object') {
      return undefined
    }

    return (value as Record<string, unknown>)[segment]
  }, object)
}

export function getDocumentReferences({ value }: { value: unknown }): DocumentReference[] {
  if (!value || typeof value !== 'object' || !('items' in value) || !Array.isArray(value.items)) {
    return []
  }
  const keys = new Set<string>()

  return value.items.filter((item): item is DocumentReference => {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.collectionSlug !== 'string' ||
      (typeof item.id !== 'string' && typeof item.id !== 'number')
    ) {
      return false
    }
    const key = documentKey(item)

    if (keys.has(key)) {
      return false
    }
    keys.add(key)
    return true
  })
}
