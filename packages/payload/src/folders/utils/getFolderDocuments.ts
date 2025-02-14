import type { CollectionSlug, FindArgs, Payload } from '../../index.js'

import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js'
import { parentFolderFieldName } from '../constants.js'

type GetFolderDocumentsArgs = {
  depth?: number
  folderID: number | string
  payload: Payload
  relationTo: CollectionSlug[]
} & Omit<FindArgs, 'collection'>
export const getFolderDocuments = async ({
  depth = 0,
  folderID,
  limit = 0,
  page,
  payload,
  relationTo,
  sort,
  where,
}: GetFolderDocumentsArgs): Promise<
  {
    relationTo: CollectionSlug
    value: any
  }[]
> => {
  const results = []
  for (const collection of relationTo) {
    const { docs } = await payload.find({
      collection,
      depth,
      limit,
      page,
      sort,
      where: combineWhereConstraints([
        where,
        folderID
          ? {
              [parentFolderFieldName]: {
                equals: folderID,
              },
            }
          : {
              [`${parentFolderFieldName}.isRoot`]: {
                equals: true,
              },
            },
      ]),
    })

    docs.forEach((doc) => {
      results.push({
        relationTo: collection,
        value: doc,
      })
    })
  }

  return results
}
