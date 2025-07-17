import type { CollectionSlug, PaginatedDocs } from '../../index.js'
import type { Document, PayloadRequest, Where } from '../../types/index.js'
import type { FolderOrDocument } from '../types.js'

import { formatFolderOrDocumentItem } from './formatFolderOrDocumentItem.js'

type JoinFieldDocs<T> = {
  count: number
  docs: (number | string | T)[]
  hasNextPage: boolean
}

type QueryDocumentsAndFoldersResults = {
  docs: FolderOrDocument[]
  folderAssignedCollections: CollectionSlug[]
  pagination: Omit<PaginatedDocs, 'docs'>
}
type QueryDocumentsAndFoldersArgs = {
  folderFieldName: string
  foldersSlug: CollectionSlug
  limit: number
  page: number
  parentFolderID: number | string
  req: PayloadRequest
  sort?: string
  where: Where
}
export async function getItemsInFolder({
  folderFieldName,
  foldersSlug,
  limit,
  page,
  parentFolderID,
  req,
  sort,
  where,
}: QueryDocumentsAndFoldersArgs): Promise<QueryDocumentsAndFoldersResults> {
  const { payload, user } = req

  const folderResult = await payload.findByID({
    id: parentFolderID,
    collection: foldersSlug,
    joins: {
      documentsAndFolders: {
        count: true,
        limit,
        page,
        sort,
        where,
      },
    },
    overrideAccess: false,
    req,
    user,
  })

  const joinResult: JoinFieldDocs<any> = folderResult.documentsAndFolders || {
    docs: [],
  }

  const docs: FolderOrDocument[] = (joinResult?.docs || []).map(
    ({ relationTo, value }: Document) => {
      return formatFolderOrDocumentItem({
        folderFieldName,
        isUpload: Boolean(payload.collections[relationTo]!.config.upload),
        relationTo,
        useAsTitle: payload.collections[relationTo]!.config.admin?.useAsTitle,
        value,
      })
    },
  )

  const totalDocs = joinResult.count || 0
  const totalPages = limit > 0 ? Math.ceil(totalDocs / limit) : 1
  const hasNextPage = joinResult.hasNextPage
  const hasPrevPage = page > 1

  const pagination = {
    hasNextPage,
    hasPrevPage,
    limit,
    nextPage: hasNextPage ? page + 1 : null,
    page,
    pagingCounter: (page - 1) * limit + 1,
    prevPage: hasPrevPage ? page - 1 : null,
    totalDocs,
    totalPages,
  }

  return {
    docs,
    folderAssignedCollections: folderResult.folderType || [],
    pagination,
  }
}
