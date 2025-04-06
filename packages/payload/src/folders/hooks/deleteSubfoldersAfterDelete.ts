import type { CollectionAfterDeleteHook } from '../../index.js'

import { foldersSlug } from '../constants.js'

type Args = {
  parentFolderFieldName: string
}
export const deleteSubfoldersAfterDelete = ({
  parentFolderFieldName,
}: Args): CollectionAfterDeleteHook => {
  return async ({ id, req }) => {
    await req.payload.delete({
      collection: foldersSlug,
      req,
      where: {
        [parentFolderFieldName]: {
          equals: id,
        },
      },
    })
  }
}
