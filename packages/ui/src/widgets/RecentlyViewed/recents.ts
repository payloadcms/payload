import type { Field, RecentlyViewedItem } from 'payload'

export type PinnedItem = Pick<RecentlyViewedItem, 'collectionSlug' | 'id'>
export type PinnedPreferences = { items: PinnedItem[] }

export const documentKey = ({ id, collectionSlug }: PinnedItem): string =>
  `${collectionSlug}:${String(id)}`

export function togglePinnedItem({
  existing,
  item,
}: {
  existing: PinnedItem[]
  item: PinnedItem
}): PinnedItem[] {
  const key = documentKey(item)
  const isPinned = existing.some((entry) => documentKey(entry) === key)

  return isPinned ? existing.filter((entry) => documentKey(entry) !== key) : [item, ...existing]
}

export function getThumbnailURL({
  doc,
  fields,
  isUploadCollection,
  useAsThumbnail,
}: {
  doc: Record<string, unknown>
  fields: Field[]
  isUploadCollection: boolean
  useAsThumbnail?: string
}): string | undefined {
  const thumbnail = isUploadCollection
    ? doc
    : getValueByPath({
        object: doc,
        path: useAsThumbnail ?? getFirstUploadPath({ fields }) ?? '',
      })

  const resolvedThumbnail = Array.isArray(thumbnail) ? thumbnail[0] : thumbnail

  if (!resolvedThumbnail || typeof resolvedThumbnail !== 'object') {
    return undefined
  }

  const upload = resolvedThumbnail as Record<string, unknown>
  return typeof upload.thumbnailURL === 'string'
    ? upload.thumbnailURL
    : typeof upload.url === 'string'
      ? upload.url
      : undefined
}

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

function getFirstUploadPath({
  fields,
  prefix = '',
}: {
  fields: Field[]
  prefix?: string
}): string | undefined {
  for (const field of fields) {
    if (field.type === 'upload') {
      return `${prefix}${field.name}`
    }

    if (field.type === 'group') {
      const path = getFirstUploadPath({
        fields: field.fields,
        prefix: 'name' in field ? `${prefix}${field.name}.` : prefix,
      })
      if (path) {
        return path
      }
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      const path = getFirstUploadPath({ fields: field.fields, prefix })
      if (path) {
        return path
      }
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const path = getFirstUploadPath({
          fields: tab.fields,
          prefix: 'name' in tab && tab.name ? `${prefix}${tab.name}.` : prefix,
        })
        if (path) {
          return path
        }
      }
    }
  }

  return undefined
}
