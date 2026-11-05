import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

import type { PathSegment } from '../ColumnBrowser/types.js'

type FetchAncestorPathArgs = {
  api: string
  collectionSlug: string
  itemId: number | string
  parentFieldName: string
  serverURL: string
  useAsTitle: string
}

export type AncestorPathResult = {
  ancestorIds: (number | string)[]
  path: PathSegment[]
}

const MAX_HIERARCHY_DEPTH = 20

/**
 * Fetches the ancestor path for an item using a single API call with depth.
 * Returns the ancestor IDs used to expand the browser and a titled path for the footer.
 */
export async function fetchAncestorPath({
  api,
  collectionSlug,
  itemId,
  parentFieldName,
  serverURL,
  useAsTitle,
}: FetchAncestorPathArgs): Promise<AncestorPathResult> {
  const queryString = qs.stringify(
    {
      depth: MAX_HIERARCHY_DEPTH,
      limit: 1,
      select: { [parentFieldName]: true, [useAsTitle]: true },
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
    return { ancestorIds: [], path: [] }
  }

  const data = await response.json()
  const doc = data.docs?.[0]

  if (!doc) {
    return { ancestorIds: [], path: [] }
  }

  const path: PathSegment[] = [toPathSegment({ id: itemId, doc, useAsTitle })]
  let current = doc[parentFieldName] as null | number | Record<string, unknown> | string

  while (current !== null && current !== undefined) {
    const parentId = typeof current === 'object' ? current.id : current

    if (parentId !== null && parentId !== undefined) {
      path.unshift(
        toPathSegment({
          id: parentId as number | string,
          doc: typeof current === 'object' ? current : undefined,
          useAsTitle,
        }),
      )
    }

    current =
      typeof current === 'object'
        ? (current[parentFieldName] as null | number | Record<string, unknown> | string)
        : null
  }

  return {
    ancestorIds: path.slice(0, -1).map((segment) => segment.id),
    path,
  }
}

function toPathSegment({
  id,
  doc,
  useAsTitle,
}: {
  doc?: Record<string, unknown>
  id: number | string
  useAsTitle: string
}): PathSegment {
  const title = doc?.[useAsTitle]

  return {
    id,
    title: typeof title === 'number' || typeof title === 'string' ? String(title) : String(id),
  }
}
