import type { Payload, PayloadRequest } from 'payload'

export type TaxonomyAncestryItem = {
  id: number | string
  path: Array<{ id: number | string; title: string }>
  title: string
}

export type TaxonomyAncestryResult = {
  items: TaxonomyAncestryItem[]
}

export type GetTaxonomyAncestryArgs = {
  ids: (number | string)[]
  payload: Payload
  taxonomySlug: string
  user?: PayloadRequest['user']
}

/**
 * Returns full ancestry paths for taxonomy items.
 * Each item includes its own title and the path from root to self.
 */
export async function getTaxonomyAncestry({
  ids,
  payload,
  taxonomySlug,
  user,
}: GetTaxonomyAncestryArgs): Promise<TaxonomyAncestryResult> {
  if (ids.length === 0) {
    return { items: [] }
  }

  const collectionConfig = payload.collections[taxonomySlug]?.config
  if (!collectionConfig?.taxonomy) {
    throw new Error(`Collection "${taxonomySlug}" is not a taxonomy`)
  }

  const taxonomyConfig = collectionConfig.taxonomy
  const parentFieldName = taxonomyConfig.parentFieldName || 'parent'
  const useAsTitle = collectionConfig.admin?.useAsTitle || 'id'

  // Cache for already-fetched items to avoid redundant queries
  const itemCache = new Map<number | string, Record<string, unknown>>()

  const fetchItem = async (id: number | string): Promise<null | Record<string, unknown>> => {
    const cached = itemCache.get(id)
    if (cached) {
      return cached
    }

    try {
      const item = await payload.findByID({
        id,
        collection: taxonomySlug,
        depth: 0,
        overrideAccess: false,
        user,
      })

      if (item) {
        itemCache.set(id, item)
      }

      return item
    } catch {
      return null
    }
  }

  const getTitle = (item: Record<string, unknown>, id: number | string): string => {
    const rawTitle = item[useAsTitle] || item.id || id

    if (rawTitle && typeof rawTitle === 'object') {
      return JSON.stringify(rawTitle)
    }

    if (typeof rawTitle === 'string') {
      return rawTitle
    }

    if (typeof rawTitle === 'number') {
      return String(rawTitle)
    }

    return String(id)
  }

  const getParentId = (item: Record<string, unknown>): null | number | string => {
    const parentValue = item[parentFieldName]

    if (!parentValue) {
      return null
    }

    if (typeof parentValue === 'object' && parentValue !== null && 'id' in parentValue) {
      return (parentValue as { id: number | string }).id
    }

    return parentValue as number | string
  }

  const buildPath = async (
    startItem: Record<string, unknown>,
    startId: number | string,
  ): Promise<Array<{ id: number | string; title: string }>> => {
    const path: Array<{ id: number | string; title: string }> = []
    let currentItem: null | Record<string, unknown> = startItem
    let currentId: null | number | string = startId

    while (currentItem && currentId !== null) {
      path.unshift({
        id: currentId,
        title: getTitle(currentItem, currentId),
      })

      const nextParentId = getParentId(currentItem)
      if (!nextParentId) {
        break
      }

      currentItem = await fetchItem(nextParentId)
      currentId = nextParentId
    }

    return path
  }

  const items: TaxonomyAncestryItem[] = []

  for (const id of ids) {
    const item = await fetchItem(id)
    if (!item) {
      continue
    }

    const path = await buildPath(item, id)
    items.push({
      id,
      path,
      title: getTitle(item, id),
    })
  }

  return { items }
}
