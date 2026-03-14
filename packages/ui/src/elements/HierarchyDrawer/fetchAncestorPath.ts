import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

type FetchAncestorPathArgs = {
  api: string
  collectionSlug: string
  itemId: number | string
  parentFieldName: string
  serverURL: string
}

const MAX_HIERARCHY_DEPTH = 20

/**
 * Fetches the ancestor path for an item using a single API call with depth.
 * Returns array of ancestor IDs from root to item's parent.
 * Example: item at level 3 returns [grandparentId, parentId]
 */
export async function fetchAncestorPath({
  api,
  collectionSlug,
  itemId,
  parentFieldName,
  serverURL,
}: FetchAncestorPathArgs): Promise<(number | string)[]> {
  const queryString = qs.stringify(
    {
      depth: MAX_HIERARCHY_DEPTH,
      limit: 1,
      select: { [parentFieldName]: true },
      where: { id: { equals: itemId } },
    },
    { addQueryPrefix: true },
  )

  const url = formatAdminURL({
    apiRoute: api,
    path: `/${collectionSlug}${queryString}`,
    serverURL,
  })

  const response = await fetch(url, { credentials: 'include' })

  if (!response.ok) {
    return []
  }

  const data = await response.json()
  const doc = data.docs?.[0]

  if (!doc) {
    return []
  }

  // Walk the nested parent chain to build path from root to immediate parent
  const path: (number | string)[] = []
  let current = doc[parentFieldName]

  while (current !== null && current !== undefined) {
    // Parent could be an ID (number/string) or a populated object
    const parentId = typeof current === 'object' ? current.id : current

    if (parentId !== null && parentId !== undefined) {
      path.unshift(parentId)
    }

    // Move to next parent (only if current is populated object)
    current = typeof current === 'object' ? current[parentFieldName] : null
  }

  return path
}
