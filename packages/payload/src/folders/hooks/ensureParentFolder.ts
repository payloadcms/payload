import type { CollectionBeforeChangeHook } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { foldersSlug, parentFolderFieldName } from '../constants.js'

const findOrCreateRootFolder = async (req: PayloadRequest) => {
  const parentFolderQuery = await req.payload.find({
    collection: foldersSlug,
    limit: 1,
    req,
    where: {
      isRoot: {
        equals: true,
      },
    },
  })

  if (!parentFolderQuery.totalDocs) {
    const rootFolder = await req.payload.create({
      collection: foldersSlug,
      data: {
        name: '_ROOT_',
        isRoot: true,
      },
      req,
    })
    return rootFolder.id
  } else {
    return parentFolderQuery.docs[0].id
  }
}

export const ensureParentFolder: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation === 'create' && !data?.[parentFolderFieldName] && !data?.isRoot) {
    data[parentFolderFieldName] = await findOrCreateRootFolder(req)
  } else if (operation === 'update' && parentFolderFieldName in data) {
    if (data[parentFolderFieldName] === null) {
      data[parentFolderFieldName] = await findOrCreateRootFolder(req)
    }
  }
}
