import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
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
   * Optional where clause to filter documents by
   * @default undefined
   */
  documentWhere?: Where
  /**
   * The ID of the folder to query documents from
   * @default undefined
   */
  folderID?: number | string
  /** Optional where clause to filter subfolders by
   * @default undefined
   */
  folderWhere?: Where
  req: PayloadRequest
}
/**
 * Query for documents, subfolders and breadcrumbs for a given folder
 */
export const getFolderData = async ({
  collectionSlug,
  documentWhere,
  folderID: _folderID,
  folderWhere,
  req,
}: Args): Promise<GetFolderDataResult> => {
  const { payload } = req

  if (payload.config.folders === false) {
    throw new Error('Folders are not enabled')
  }

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
      documentWhere,
      folderWhere,
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
      folderFieldName: payload.config.folders.fieldName,
      req,
      where: folderWhere,
    })
    const documentsPromise = collectionSlug
      ? getOrphanedDocs({
          collectionSlug,
          folderFieldName: payload.config.folders.fieldName,
          req,
          where: documentWhere,
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
