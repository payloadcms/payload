import type { CollectionSlug, Payload, User } from '../../index.js'
import type { FolderOrDocument } from '../types.js'

import { formatFolderOrDocumentItem } from './formatFolderOrDocumentItem.js'

type Args = {
  collectionSlug: CollectionSlug
  payload: Payload
  user?: User
}
export async function getOrphanedDocs({
  collectionSlug,
  payload,
  user,
}: Args): Promise<FolderOrDocument[]> {
  const orphanedFolders = await payload.find({
    collection: collectionSlug,
    limit: 0,
    // overrideAccess: false, // @todo: bug in core, throws "QueryError: The following paths cannot be queried: _folder"
    sort: payload.collections[collectionSlug].config.admin.useAsTitle,
    user,
    where: {
      or: [
        {
          _folder: {
            exists: false,
          },
        },
        {
          _folder: {
            equals: null,
          },
        },
      ],
    },
  })

  return (
    orphanedFolders?.docs.map((doc) =>
      formatFolderOrDocumentItem({
        isUpload: Boolean(payload.collections[collectionSlug].config.upload),
        relationTo: collectionSlug,
        useAsTitle: payload.collections[collectionSlug].config.admin.useAsTitle,
        value: doc,
      }),
    ) || []
  )
}
