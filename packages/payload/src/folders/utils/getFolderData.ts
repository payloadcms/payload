import type { Payload, Where } from '../../types/index.js'
import type { GetFolderDataResult } from '../types.js'

import { type CollectionSlug, parseDocumentID, type User } from '../../index.js'
import { buildFolderBreadcrumbs } from './buildFolderBreadcrumbs.js'
import {
  getFolderMonomorphicDocuments,
  getFolderPolymorphicDocuments,
} from './getFolderDocuments.js'
import { getFolderSubfolders } from './getFolderSubfolders.js'

type Args = {
  collectionSlugs: CollectionSlug[]
  docSort?: string
  docWhere?: Where
  folderID?: number | string
  locale?: string
  payload: Payload
  search?: string
  type: 'monomorphic' | 'polymorphic'
  user?: User
}
/**
 * Query for documents subfolders and breadcrumbs for a given folder
 *
 * Subfolders and documents are queried separately to ensure folders can be separated to match the UI
 */
export const getFolderData = async ({
  type,
  collectionSlugs,
  docSort,
  docWhere,
  folderID: _folderID,
  locale,
  payload,
  search,
  user,
}: Args): Promise<GetFolderDataResult> => {
  const parentFolderID = parseDocumentID({
    id: _folderID,
    collectionSlug: payload.config.folders.slug,
    payload,
  })

  const breadcrumbsPromise = buildFolderBreadcrumbs({
    folderID: parentFolderID,
    payload,
    user,
  })

  const subfoldersPromise = getFolderSubfolders({
    parentFolderID,
    payload,
    search,
    user,
  })

  let documentsPromise

  if (type === 'monomorphic') {
    documentsPromise = getFolderMonomorphicDocuments({
      collectionSlug: collectionSlugs[0],
      locale,
      parentFolderID,
      payload,
      search,
      sort: docSort,
      user,
      where: docWhere,
    })
  } else {
    documentsPromise = getFolderPolymorphicDocuments({
      collectionSlugs,
      locale,
      parentFolderID,
      payload,
      search,
      sort: docSort,
      user,
    })
  }

  const [breadcrumbs, subfolders, documents] = await Promise.all([
    breadcrumbsPromise,
    subfoldersPromise,
    documentsPromise,
  ])

  return {
    breadcrumbs: breadcrumbs || [],
    documents: documents?.docs || [],
    hasMoreDocuments: Boolean(documents?.hasMoreDocuments),
    subfolders: subfolders || [],
  }
}
