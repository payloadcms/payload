import type { CollectionSlug, FindArgs, Payload, Where } from '../../index.js'

import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js'
import { parentFolderFieldName } from '../constants.js'

type GetFolderDocumentsArgs = {
  depth?: number
  folderID: null | number | string
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
  const results: {
    relationTo: CollectionSlug
    value: any
  }[] = []
  for (const collection of relationTo) {
    const constraints: Where[] = [
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
    ]
    if (where) {
      constraints.push(where)
    }
    const { docs } = await payload.find({
      collection,
      depth,
      limit,
      page,
      sort,
      where: combineWhereConstraints(constraints),
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
