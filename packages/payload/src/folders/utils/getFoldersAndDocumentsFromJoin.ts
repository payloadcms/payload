import type { User } from '../../auth/types.js'
import type { PaginatedDocs } from '../../database/types.js'
import type { CollectionSlug } from '../../index.js'
import type { Document, Payload } from '../../types/index.js'
import type { FolderOrDocument } from '../types.js'

import { formatFolderOrDocumentItem } from './formatFolderOrDocumentItem.js'

type QueryDocumentsAndFoldersResults = {
  documents: FolderOrDocument[]
  subfolders: FolderOrDocument[]
}
type QueryDocumentsAndFoldersArgs = {
  collectionSlug?: CollectionSlug
  parentFolderID: number | string
  payload: Payload
  user?: User
}
export async function queryDocumentsAndFoldersFromJoin({
  collectionSlug,
  parentFolderID,
  payload,
  user,
}: QueryDocumentsAndFoldersArgs): Promise<QueryDocumentsAndFoldersResults> {
  const folderCollectionSlugs: string[] = payload.config.collections.reduce<string[]>(
    (acc, collection) => {
      if (collection?.folders) {
        acc.push(collection.slug)
      }
      return acc
    },
    [],
  )

  const subfolderDoc = (await payload.find({
    collection: payload.config.folders.slug,
    joins: {
      documentsAndFolders: {
        limit: 100_000,
        sort: 'name',
        where: {
          relationTo: {
            in: [
              payload.config.folders.slug,
              ...(collectionSlug ? [collectionSlug] : folderCollectionSlugs),
            ],
          },
        },
      },
    },
    limit: 1,
    overrideAccess: false,
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
