import type { CollectionAfterDeleteHook } from '../../index.js'

type Args = {
  folderSlug: string
  parentFolderFieldName: string
}
export const deleteSubfoldersAfterDelete = ({
  folderSlug,
  parentFolderFieldName,
}: Args): CollectionAfterDeleteHook => {
  return async ({ id, req }) => {
    await req.payload.delete({
      collection: folderSlug,
      depth: 0,
      overrideAccess: false,
      req,
      select: { id: true },
      where: {
        [parentFolderFieldName]: {
          equals: id,
        },
      },
    })
  }
}
