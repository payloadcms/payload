import type { CollectionSlug, Payload, User, Where } from '../../index.js'
import type { FolderOrDocument } from '../types.js'

import { formatFolderOrDocumentItem } from './formatFolderOrDocumentItem.js'

type Args = {
  collectionSlug: CollectionSlug
  payload: Payload
  search?: string
  user?: User
}
export async function getOrphanedDocs({
  collectionSlug,
  payload,
  search,
  user,
}: Args): Promise<FolderOrDocument[]> {
  let whereConstraints: Where = {
    or: [
      {
        [payload.config.folders.fieldName]: {
          exists: false,
        },
      },
      {
        [payload.config.folders.fieldName]: {
          equals: null,
        },
      },
    ],
  }

  if (collectionSlug && search && payload.collections[collectionSlug].config.admin?.useAsTitle) {
    whereConstraints = {
      [payload.collections[collectionSlug].config.admin.useAsTitle]: {
        like: search,
      },
    }
  }

  const orphanedFolders = await payload.find({
    collection: collectionSlug,
    limit: 0,
    overrideAccess: false,
    sort: payload.collections[collectionSlug].config.admin.useAsTitle,
    user,
    where: whereConstraints,
  })

  return (
    orphanedFolders?.docs.map((doc) =>
      formatFolderOrDocumentItem({
        folderFieldName: payload.config.folders.fieldName,
        isUpload: Boolean(payload.collections[collectionSlug].config.upload),
        relationTo: collectionSlug,
        useAsTitle: payload.collections[collectionSlug].config.admin.useAsTitle,
        value: doc,
      }),
    ) || []
  )
}
