import type { CollectionSlug } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'
import type { FolderOrDocument, FolderSortKeys, GetFolderDataResult } from '../types.js'

import { APIError, parseDocumentID } from '../../index.js'
import { getDocsAndPagination } from './getDocsAndPagination.js'
import { getFolderBreadcrumbs } from './getFolderBreadcrumbs.js'

type Args = {
  /**
   * Specify to query documents from a specific collection
   * @default undefined
   * @example 'posts'
   */
  collectionSlug?: CollectionSlug
  /**
   * The `limit` parameter used for document pagination
   * @default 10
   */
  docLimit: number
  /**
   * The `page` parameter used for document pagination
   * @default 1
   */
  docPage: number
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
  /**
   * The `limit` parameter used for folder pagination
   * @default 10
   */
  folderLimit?: number
  /**
   * The `page` parameter used for folder pagination
   * @default 1
   */
  folderPage?: number
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
  docLimit,
  docPage,
  documentWhere,
  folderID: _folderID,
  folderLimit = 100,
  folderPage = 1,
  folderWhere,
  req,
  sort = 'name',
}: Args): Promise<GetFolderDataResult> => {
  const { payload } = req

  if (payload.config.folders === false) {
    throw new APIError('Folders are not enabled', 500)
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

  const foldersPromise = getDocsAndPagination({
    collectionSlug: payload.config.folders.slug,
    folderFieldName: payload.config.folders.fieldName,
    foldersSlug: payload.config.folders.slug,
    limit: folderLimit,
    page: folderPage,
    parentFolderID,
    req,
    // sort,
    where: folderWhere || {},
  })

  const documentsPromise = getDocsAndPagination({
    collectionSlug,
    folderFieldName: payload.config.folders.fieldName,
    foldersSlug: payload.config.folders.slug,
    limit: docLimit,
    page: docPage,
    parentFolderID,
    req,
    // sort,
    where: documentWhere || {},
  })

  const [breadcrumbs, foldersResult, documentsResult] = await Promise.all([
    breadcrumbsPromise,
    foldersPromise,
    documentsPromise,
  ])

  const {
    docs: subfolders,
    folderAssignedCollections: _folderAssignedCollections,
    pagination: foldersPagination,
  } = foldersResult
  const { docs: documents, pagination: documentsPagination } = documentsResult

  /**
   * 1. If no parentFolderID and you are viewing a specific collection,
   * then the folderAssignedCollections will be the collection slug.
   *
   * 2. If no parentFolderID and you are not viewing a specific collection,
   * then the folderAssignedCollections will be undefined. (i.e. all collections can be assigned)
   *
   * 3. If there is a parentFolderID use the folderAssignedCollections from the subfolders result.
   */
  const folderAssignedCollections = !parentFolderID
    ? collectionSlug
      ? [collectionSlug]
      : undefined
    : _folderAssignedCollections

  return {
    breadcrumbs,
    documents: sortDocs({ docs: documents, sort }),
    documentsPagination,
    folderAssignedCollections,
    foldersPagination,
    subfolders: sortDocs({ docs: subfolders, sort }),
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
