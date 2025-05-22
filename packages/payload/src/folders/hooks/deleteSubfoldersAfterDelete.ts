import type { CollectionAfterDeleteHook } from '../../index.js'

type Args = {
  folderFieldName: string
  folderSlug: string
}
export const deleteSubfoldersAfterDelete = ({
  folderFieldName,
  folderSlug,
}: Args): CollectionAfterDeleteHook => {
  return async ({ id, req }) => {
    await req.payload.delete({
      collection: folderSlug,
      req,
      where: {
        [folderFieldName]: {
          equals: id,
        },
      },
    })
  }
}
