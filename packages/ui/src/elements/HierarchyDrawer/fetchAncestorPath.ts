import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

type FetchAncestorPathArgs = {
  api: string
  collectionSlug: string
  itemId: number | string
  parentFieldName: string
  serverURL: string
}

/**
 * Fetches the ancestor path for an item by recursively fetching parents.
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
  const path: (number | string)[] = []
  let currentId: null | number | string = itemId

  while (currentId !== null) {
    const queryString = qs.stringify(
      {
        depth: 0,
        limit: 1,
        select: { [parentFieldName]: true },
        where: { id: { equals: currentId } },
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
      break
    }

    const data = await response.json()
    const doc = data.docs?.[0]

    if (!doc) {
      break
    }

    const parentId = doc[parentFieldName]

    if (parentId !== null && parentId !== undefined) {
      path.unshift(parentId)
      currentId = parentId
    } else {
      break
    }
  }

  return path
}
