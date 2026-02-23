import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { FolderBreadcrumb } from '../types.js'

import { getAncestors } from '../../hierarchy/index.js'

type GetFolderBreadcrumbsArgs = {
  /**
   * The slug of the folder collection
   */
  collectionSlug: CollectionSlug
  /**
   * The folder ID to get breadcrumbs for
   */
  folderID?: number | string
  req: PayloadRequest
}

/**
 * Builds breadcrumbs up from child folder all the way up to root folder.
 * Uses the shared hierarchy getAncestors utility for efficient caching.
 */
export const getFolderBreadcrumbs = async ({
  collectionSlug,
  folderID,
  req,
}: GetFolderBreadcrumbsArgs): Promise<FolderBreadcrumb[] | null> => {
  if (!folderID) {
    return null
  }

  const ancestors = await getAncestors({
    id: folderID,
    collectionSlug,
    req,
  })

  // Map Ancestor format to FolderBreadcrumb format for backward compatibility
  return ancestors.map((ancestor) => ({
    id: ancestor.id,
    name: ancestor.title,
  }))
}
