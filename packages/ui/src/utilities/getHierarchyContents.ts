import type { HierarchyContents, ServerFunction } from 'payload'

import { APIError, canAccessAdmin, getHierarchyContents } from 'payload'

export type GetHierarchyContentsArgs = {
  collectionSlug: string
  limit?: number
  page?: number
  parentID?: null | number | string
  search?: string
  source?: string
}

export const getHierarchyContentsHandler: ServerFunction<
  GetHierarchyContentsArgs,
  Promise<HierarchyContents>
> = async ({ collectionSlug, limit, page, parentID, req, search, source }) => {
  await canAccessAdmin({ req })

  if (typeof collectionSlug !== 'string' || collectionSlug.length === 0) {
    throw new APIError('Invalid hierarchy contents collection', 400)
  }

  return getHierarchyContents({ collectionSlug, limit, page, parentID, req, search, source })
}
