import type { PinnedDocument } from 'payload'

export type PinnedItem = PinnedDocument
export const documentKey = ({ id, collectionSlug }: PinnedItem): string =>
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
