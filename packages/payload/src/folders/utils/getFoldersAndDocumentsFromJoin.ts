import type { PaginatedDocs } from '../../database/types.js'
import type { Document, PayloadRequest, Where } from '../../types/index.js'
import type { FolderOrDocument } from '../types.js'

import { formatFolderOrDocumentItem } from './formatFolderOrDocumentItem.js'

type QueryDocumentsAndFoldersResults = {
  documents: FolderOrDocument[]
  subfolders: FolderOrDocument[]
}
type QueryDocumentsAndFoldersArgs = {
  /**
   * Optional where clause to filter documents by
   * @default undefined
   */
  documentWhere: Where // todo: make optional
  /** Optional where clause to filter subfolders by
   * @default undefined
   */
  folderWhere: Where // todo: make optional
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

  const whereConstraints = [folderWhere, documentWhere].filter(Boolean)

  const subfolderDoc = (await payload.find({
    collection: payload.config.folders.slug,
    joins: {
      documentsAndFolders: {
        limit: 100_000_000,
        sort: 'name',
        where:
          whereConstraints.length > 0
            ? {
                or: whereConstraints,
              }
            : undefined,
      },
    },
    limit: 1,
    overrideAccess: false,
    req,
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
      const { relationTo, value } = doc
      const item = formatFolderOrDocumentItem({
        folderFieldName: payload.config.folders.fieldName,
        isUpload: Boolean(payload.collections[relationTo].config.upload),
        relationTo,
        useAsTitle: payload.collections[relationTo].config.admin?.useAsTitle,
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

  return results
}
