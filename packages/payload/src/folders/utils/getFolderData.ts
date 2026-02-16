import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { FolderOrDocument, FolderSortKeys, GetFolderDataResult } from '../types.js'

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
  sort: FolderSortKeys
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
  sort = 'name',
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
    const [breadcrumbs, result] = await Promise.all([
      breadcrumbsPromise,
      documentAndSubfolderPromise,
    ])

    return {
      breadcrumbs,
      documents: sortDocs({ docs: result.documents, sort }),
      folderAssignedCollections: result.folderAssignedCollections,
      subfolders: sortDocs({ docs: result.subfolders, sort }),
    }
  } else {
    const subfoldersPromise = getOrphanedDocs({
      collectionSlug: payload.config.folders.slug,
      folderFieldName: payload.config.folders.fieldName,
      req,
      where: folderWhere,
    })

    const documentsPromise =
      collectionSlug && payload.collections[collectionSlug]
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
      documents: sortDocs({ docs: documents, sort }),
      folderAssignedCollections: collectionSlug ? [collectionSlug] : undefined,
      subfolders: sortDocs({ docs: subfolders, sort }),
    }
  }
}

function sortDocs({
  docs,
  sort,
}: {
  docs: FolderOrDocument[]
  sort?: FolderSortKeys
}): FolderOrDocument[] {
  if (!sort) {
    return docs
  }
  const isDesc = typeof sort === 'string' && sort.startsWith('-')
  const sortKey = (isDesc ? sort.slice(1) : sort) as FolderSortKeys

  return docs.sort((a, b) => {
    let result = 0
    if (sortKey === 'name') {
      result = a.value._folderOrDocumentTitle.localeCompare(b.value._folderOrDocumentTitle)
    } else if (sortKey === 'createdAt') {
      result =
        new Date(a.value.createdAt || '').getTime() - new Date(b.value.createdAt || '').getTime()
    } else if (sortKey === 'updatedAt') {
      result =
        new Date(a.value.updatedAt || '').getTime() - new Date(b.value.updatedAt || '').getTime()
    }
    return isDesc ? -result : result
  })
}
