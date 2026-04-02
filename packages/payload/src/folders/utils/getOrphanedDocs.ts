import type { CollectionSlug, PayloadRequest, Where } from '../../index.js'
import type { FolderOrDocument } from '../types.js'

import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js'
import { formatFolderOrDocumentItem } from './formatFolderOrDocumentItem.js'

type Args = {
  collectionSlug: CollectionSlug
  folderFieldName: string
  req: PayloadRequest
  /**
   * Optional where clause to filter documents by
   * @default undefined
   */
  where?: Where
}
export async function getOrphanedDocs({
  collectionSlug,
  folderFieldName,
  req,
  where,
}: Args): Promise<FolderOrDocument[]> {
  const { payload, user } = req
  const noParentFolderConstraint: Where = {
    or: [
      {
        [folderFieldName]: {
          exists: false,
        },
      },
      {
        [folderFieldName]: {
          equals: null,
        },
      },
    ],
  }

  const orphanedFolders = await payload.find({
    collection: collectionSlug,
    limit: 0,
    overrideAccess: false,
    req,
    sort: payload.collections[collectionSlug]?.config.admin.useAsTitle,
    user,
    where: where
      ? combineWhereConstraints([noParentFolderConstraint, where])
      : noParentFolderConstraint,
  })

  return (
    orphanedFolders?.docs.map((doc) =>
      formatFolderOrDocumentItem({
        folderFieldName,
        isUpload: Boolean(payload.collections[collectionSlug]?.config.upload),
        relationTo: collectionSlug,
        useAsTitle: payload.collections[collectionSlug]?.config.admin.useAsTitle,
        value: doc,
      }),
    ) || []
  )
}
