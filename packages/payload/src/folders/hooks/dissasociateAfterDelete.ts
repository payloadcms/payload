import type { CollectionAfterDeleteHook } from '../../index.js'

type Args = {
  collectionSlugs: string[]
  parentFolderFieldName: string
}
export const dissasociateAfterDelete = ({
  collectionSlugs,
  parentFolderFieldName,
}: Args): CollectionAfterDeleteHook => {
  return async ({ id, req }) => {
    for (const collectionSlug of collectionSlugs) {
      await req.payload.update({
        collection: collectionSlug,
        data: {
          [parentFolderFieldName]: null,
        },
        depth: 0,
        overrideAccess: false,
        req,
        select: {
          id: true,
        },
        where: {
          [parentFolderFieldName]: {
            equals: id,
          },
        },
      })
    }
  }
}
