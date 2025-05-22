import type { CollectionAfterDeleteHook } from '../../index.js'

type Args = {
  collectionSlugs: string[]
  folderFieldName: string
}
export const dissasociateAfterDelete = ({
  collectionSlugs,
  folderFieldName,
}: Args): CollectionAfterDeleteHook => {
  return async ({ id, req }) => {
    for (const collectionSlug of collectionSlugs) {
      await req.payload.update({
        collection: collectionSlug,
        data: {
          [folderFieldName]: null,
        },
        depth: 0,
        overrideAccess: false,
        req,
        select: {
          id: true,
        },
        where: {
          [folderFieldName]: {
            equals: id,
          },
        },
      })
    }
  }
}
