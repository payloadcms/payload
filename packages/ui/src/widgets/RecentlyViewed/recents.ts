import type { PinnedDocument } from 'payload'

export type PinnedItem = PinnedDocument

/** Every page size the widget's CSS tiers can produce. Keep in sync with `--recents-page-size`. */
export const PAGE_SIZES = [4, 5, 6, 7, 8] as const
/** Documents are fetched in fixed batches that fill the largest page. */
export const DOCUMENTS_BATCH_SIZE = 8
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
