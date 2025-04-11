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
  /**
   * The collection slugs to query documents from
   * - If empty, no documents will be queried, just subfolders
   * - If `type` is `monomorphic`, only the first slug will be used
   * - If `type` is `polymorphic`, all slugs will be used
   * @default []
   * @example ['posts', 'pages']
   */
  collectionSlugs: CollectionSlug[]
  /**
   * The sort to apply to documents
   * @default undefined
   * @example 'createdAt_desc'
   */
  docSort?: string
  /**
   * The where clause to apply to documents
   * @default undefined
   */
  docWhere?: Where
  /**
   * The ID of the folder to query documents from
   * @default undefined
   */
  folderID?: number | string
  /**
   * The locale to use for the document query
   * @default undefined
   */
  locale?: string
  /**
   * A Payload instance
   */
  payload: Payload
  /**
   * The search string to apply to documents and subfolders
   * - If `type` is `monomorphic`, `listSearchableFields` will be used
   * - If `type` is `polymorphic`, `_folderSearch` will be used
   * @default undefined
   */
  search?: string
  /**
   * How the documents should be queried
   * - `monomorphic` - query documents their collections
   * - `polymorphic` - query documents from the parent folder join field
   */
  type: 'monomorphic' | 'polymorphic'
  /**
   * The user making the request
   * @default undefined
   */
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

  if (!collectionSlugs.length) {
    documentsPromise = Promise.resolve({
      docs: [],
    })
  } else {
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
  }

  const [breadcrumbs, subfolders, documents] = await Promise.all([
    breadcrumbsPromise,
    subfoldersPromise,
    documentsPromise,
  ])

  return {
    breadcrumbs: breadcrumbs || [],
    documents: documents?.docs || [],
    subfolders: subfolders || [],
  }
}
