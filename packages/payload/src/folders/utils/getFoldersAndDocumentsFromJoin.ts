import type { PaginatedDocs } from '../../database/types.js'
import type { CollectionSlug } from '../../index.js'
import type { Document, PayloadRequest, Where } from '../../types/index.js'
import type { FolderOrDocument } from '../types.js'

import { APIError } from '../../errors/APIError.js'
import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js'
import { formatFolderOrDocumentItem } from './formatFolderOrDocumentItem.js'

type QueryDocumentsAndFoldersResults = {
  documents: FolderOrDocument[]
  folderAssignedCollections: CollectionSlug[]
  subfolders: FolderOrDocument[]
}
type QueryDocumentsAndFoldersArgs = {
  /**
   * Optional where clause to filter documents by
   * @default undefined
   */
  documentWhere?: Where
  /** Optional where clause to filter subfolders by
   * @default undefined
   */
  folderWhere?: Where
  parentFolderID: number | string
  req: PayloadRequest
}
export async function queryDocumentsAndFoldersFromJoin({
  documentWhere,
  folderWhere,
  parentFolderID,
  req,
}: QueryDocumentsAndFoldersArgs): Promise<QueryDocumentsAndFoldersResults> {
  const { payload, user } = req

  if (payload.config.folders === false) {
    throw new APIError('Folders are not enabled', 500)
  }

  const subfolderDoc = (await payload.find({
    collection: payload.config.folders.slug,
    depth: 1,
    joins: {
      documentsAndFolders: {
        limit: 100_000_000,
        sort: 'name',
        where: combineWhereConstraints([folderWhere, documentWhere], 'or'),
      },
    },
    limit: 1,
    overrideAccess: false,
    req,
    select: {
      documentsAndFolders: true,
      folderType: true,
    },
    user,
    where: {
      id: {
        equals: parentFolderID,
      },
    },
  })) as PaginatedDocs<Document>

  const childrenDocs = subfolderDoc?.docs[0]?.documentsAndFolders?.docs || []

  const results: QueryDocumentsAndFoldersResults = childrenDocs.reduce(
    (acc: QueryDocumentsAndFoldersResults, doc: Document) => {
      if (!payload.config.folders) {
        return acc
      }
      const { relationTo, value } = doc
      const item = formatFolderOrDocumentItem({
        folderFieldName: payload.config.folders.fieldName,
        isUpload: Boolean(payload.collections[relationTo]!.config.upload),
        relationTo,
        useAsTitle: payload.collections[relationTo]!.config.admin?.useAsTitle,
        value,
      })

      if (relationTo === payload.config.folders.slug) {
        acc.subfolders.push(item)
      } else {
        acc.documents.push(item)
      }

      return acc
    },
    {
      documents: [],
      subfolders: [],
    },
  )

  return {
    documents: results.documents,
    folderAssignedCollections: subfolderDoc?.docs[0]?.folderType || [],
    subfolders: results.subfolders,
  }
}
