import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { GetFolderDataResult } from '../types.js'

import { parseDocumentID } from '../../index.js'
import { getFolderBreadcrumbs } from './getFolderBreadcrumbs.js'
import { queryDocumentsAndFoldersFromJoin } from './getFoldersAndDocumentsFromJoin.js'
import { getOrphanedDocs } from './getOrphanedDocs.js'

type Args = {
  /**
   * Specify to query documents from a specific collection
   * @default undefined
   * @example 'posts'
   */
  collectionSlug?: CollectionSlug
  /**
   * The ID of the folder to query documents from
   * @default undefined
   */
  folderID?: number | string
  req: PayloadRequest
  /**
   * Search term to filter documents by - only applicable IF `collectionSlug` exists and NO `folderID` is provided
   */
  search?: string
}
/**
 * Query for documents, subfolders and breadcrumbs for a given folder
 */
export const getFolderData = async ({
  collectionSlug,
  folderID: _folderID,
  req,
  search,
}: Args): Promise<GetFolderDataResult> => {
  const { payload } = req
  const parentFolderID = parseDocumentID({
    id: _folderID,
    collectionSlug: payload.config.folders.slug,
    payload,
  })

  const breadcrumbsPromise = getFolderBreadcrumbs({
    folderID: parentFolderID,
    req,
  })

  if (parentFolderID) {
    // subfolders and documents are queried together
    const documentAndSubfolderPromise = queryDocumentsAndFoldersFromJoin({
      collectionSlug,
      parentFolderID,
      req,
    })
    const [breadcrumbs, documentsAndSubfolders] = await Promise.all([
      breadcrumbsPromise,
      documentAndSubfolderPromise,
    ])

    return {
      breadcrumbs,
      documents: documentsAndSubfolders.documents,
      subfolders: documentsAndSubfolders.subfolders,
    }
  } else {
    // subfolders and documents are queried separately
    const subfoldersPromise = getOrphanedDocs({
      collectionSlug: payload.config.folders.slug,
      req,
      search,
    })
    const documentsPromise = collectionSlug
      ? getOrphanedDocs({
          collectionSlug,
          req,
          search,
        })
      : Promise.resolve([])
    const [breadcrumbs, subfolders, documents] = await Promise.all([
      breadcrumbsPromise,
      subfoldersPromise,
      documentsPromise,
    ])
    return {
      breadcrumbs,
      documents,
      subfolders,
    }
  }
}
