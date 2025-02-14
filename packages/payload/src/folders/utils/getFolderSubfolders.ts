import type { Payload } from '../../types/index.js'
import type { FolderInterface } from '../types.js'

import { foldersSlug } from '../constants.js'

type GetSubfoldersArgs = {
  folderID?: null | number | string
  payload: Payload
}
export const getFolderSubfolders = async ({
  folderID,
  payload,
}: GetSubfoldersArgs): Promise<FolderInterface[]> => {
  const currentFolderQuery = await payload.find({
    collection: foldersSlug,
    joins: {
      documentsAndFolders: {
        limit: 0,
        sort: 'name',
        // @todo
        // add a where constraint to only return subfolder documents
      },
    },
    limit: 1,
    where: folderID
      ? {
          id: {
            equals: folderID,
          },
        }
      : {
          isRoot: {
            equals: true,
          },
        },
  })
  return currentFolderQuery?.docs[0]?.documentsAndFolders?.docs || []
}
