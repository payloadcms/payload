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

type FetchAncestorPathsArgs = {
  itemIds: (number | string)[]
} & Omit<FetchAncestorPathArgs, 'itemId'>

export type AncestorPathResult = {
  /** Ancestor IDs from root down to the item's immediate parent, excluding the item itself */
  ancestorIds: (number | string)[]
  /** Full path from root down to the item itself, with titles */
  path: PathSegment[]
}

const MAX_HIERARCHY_DEPTH = 20

const EMPTY_RESULT: AncestorPathResult = { ancestorIds: [], path: [] }

/**
 * Fetches the ancestor paths for several items in a single API call with depth.
 * Each populated parent chain is walked to build a titled breadcrumb from root to the item.
 */
export async function fetchAncestorPaths({
  api,
  collectionSlug,
  itemIds,
  parentFieldName,
  serverURL,
  useAsTitle,
}: FetchAncestorPathsArgs): Promise<Map<number | string, AncestorPathResult>> {
  const results = new Map<number | string, AncestorPathResult>()

  if (itemIds.length === 0) {
    return results
  }

  const queryString = qs.stringify(
    {
      depth: MAX_HIERARCHY_DEPTH,
      limit: itemIds.length,
      select: { [parentFieldName]: true, [useAsTitle]: true },
      where: { id: { in: itemIds } },
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
    return results
  }

  const data = await response.json()

  for (const doc of (data.docs || []) as Record<string, unknown>[]) {
    const id = doc.id as number | string

    if (id === null || id === undefined) {
      continue
    }

    results.set(id, buildAncestorPath({ id, doc, parentFieldName, useAsTitle }))
  }

  return results
}

/**
 * Fetches the ancestor path for a single item. See {@link fetchAncestorPaths}.
 */
export async function fetchAncestorPath({
  itemId,
  ...rest
}: FetchAncestorPathArgs): Promise<AncestorPathResult> {
  const results = await fetchAncestorPaths({ ...rest, itemIds: [itemId] })

  return results.get(itemId) ?? EMPTY_RESULT
}

function buildAncestorPath({
  id,
  doc,
  parentFieldName,
  useAsTitle,
}: {
  doc: Record<string, unknown>
  id: number | string
  parentFieldName: string
  useAsTitle: string
}): AncestorPathResult {
  const toTitle = (
    value: Record<string, unknown> | undefined,
    segmentID: number | string,
  ): string => {
    const rawTitle = value?.[useAsTitle]
    return typeof rawTitle === 'string' || typeof rawTitle === 'number'
      ? String(rawTitle)
      : String(segmentID)
  }

  const path: PathSegment[] = [{ id, title: toTitle(doc, id) }]

  let current: Record<string, unknown> | undefined = doc

  for (let depth = 0; depth < MAX_HIERARCHY_DEPTH; depth++) {
    const parent = current?.[parentFieldName]

    if (parent === null || parent === undefined) {
      break
    }

    // Parent is either a populated document or a bare ID once the depth limit is hit
    if (typeof parent === 'object') {
      const parentDoc = parent as Record<string, unknown>
      const parentID = parentDoc.id as number | string

      if (parentID === null || parentID === undefined) {
        break
      }

      path.unshift({ id: parentID, title: toTitle(parentDoc, parentID) })
      current = parentDoc
    } else {
      const parentID = parent as number | string
      path.unshift({ id: parentID, title: String(parentID) })
      break
    }
  }

  return {
    ancestorIds: path.slice(0, -1).map((segment) => segment.id),
    path,
  }
}
