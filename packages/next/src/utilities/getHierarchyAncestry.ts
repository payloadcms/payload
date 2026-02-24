import type { Payload, PayloadRequest } from 'payload'

export type HierarchyAncestryItem = {
  id: number | string
  path: Array<{ id: number | string; title: string }>
  title: string
}

export type HierarchyAncestryResult = {
  items: HierarchyAncestryItem[]
}

export type GetHierarchyAncestryArgs = {
  hierarchySlug: string
  ids: (number | string)[]
  payload: Payload
  user?: PayloadRequest['user']
}

/**
 * Returns full ancestry paths for hierarchy items.
 * Each item includes its own title and the path from root to self.
 */
export async function getHierarchyAncestry({
  hierarchySlug,
  ids,
  payload,
  user,
}: GetHierarchyAncestryArgs): Promise<HierarchyAncestryResult> {
  if (ids.length === 0) {
    return { items: [] }
  }

  const collectionConfig = payload.collections[hierarchySlug]?.config
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined

  if (!hierarchyConfig) {
    throw new Error(`Collection "${hierarchySlug}" is not a hierarchy`)
  }

  const parentFieldName = hierarchyConfig.parentFieldName
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
        collection: hierarchySlug,
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

  const items: HierarchyAncestryItem[] = []

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
