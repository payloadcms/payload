import type { CollectionSlug, FindArgs, Payload, User, Where } from '../../index.js'

import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js'
import { foldersSlug, parentFolderFieldName } from '../constants.js'

type GetFolderDocumentsReturnType = {
  docs: {
    relationTo: CollectionSlug
    value: any
  }[]
  hasMoreDocuments: boolean
}
type GetFolderDocumentsArgs = {
  depth?: number
  folderID: number | string
  payload: Payload
  search?: null | string
  user?: User
} & Omit<FindArgs, 'collection'>
export const getFolderDocuments = async (
  args: GetFolderDocumentsArgs,
): Promise<GetFolderDocumentsReturnType> => {
  return fetchWithJoin(args)
}

async function fetchWithJoin({
  folderID,
  limit = 10,
  page = 1,
  payload,
  search,
  sort,
  user,
  where,
}: GetFolderDocumentsArgs): Promise<GetFolderDocumentsReturnType> {
  const constraints: (undefined | Where)[] = [
    where,
    {
      relationTo: {
        not_equals: foldersSlug,
      },
    },
    {
      [parentFolderFieldName]: {
        equals: folderID,
      },
    },
  ]

  if (search) {
    constraints.push({
      _folderSearch: {
        like: search,
      },
    })
  }

  const currentFolderQuery = await payload.find({
    collection: foldersSlug,
    joins: {
      documentsAndFolders: {
        limit,
        page,
        sort: typeof sort === 'string' ? sort : '_folderSearch',
        where: combineWhereConstraints(constraints),
      },
    },
    limit: 1,
    user,
    where: {
      id: {
        equals: folderID,
      },
    },
  })

  return currentFolderQuery?.docs[0]?.documentsAndFolders
}

async function manuallyBuildRelations({
  depth = 0,
  folderID,
  limit = 0,
  page,
  payload,
  sort,
  where,
}: GetFolderDocumentsArgs) {
  const relationTo = Object.keys(payload.config.folders.collections)

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
