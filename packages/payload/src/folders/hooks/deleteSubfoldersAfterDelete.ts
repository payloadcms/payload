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
      req,
      where: {
        [parentFolderFieldName]: {
          equals: id,
        },
      },
    })
  }
}
