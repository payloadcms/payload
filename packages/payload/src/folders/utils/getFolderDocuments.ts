import type { CollectionSlug, Payload, User, Where } from '../../index.js'

import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js'
import { mergeListSearchAndWhere } from '../../utilities/mergeListSearchAndWhere.js'

export async function getFolderMonomorphicDocuments({
  collectionSlug,
  locale,
  parentFolderID,
  payload,
  search,
  sort,
  user,
  where,
}: {
  collectionSlug: CollectionSlug
  locale?: string
  parentFolderID?: number | string
  payload: Payload
  search?: string
  sort?: string
  user?: User
  where?: Where
}): Promise<{
  docs: {
    relationTo: CollectionSlug
    value: any
  }[]
  hasMoreDocuments: boolean
}> {
  const whereConstraints: Where[] = [
    mergeListSearchAndWhere({
      collectionConfig: payload.collections[collectionSlug].config,
      search,
      where,
    }),
  ]

  whereConstraints.push(
    parentFolderID
      ? {
          _parentFolder: {
            equals: parentFolderID,
          },
        }
      : {
          _parentFolder: {
            exists: false,
          },
        },
  )

  const result = await payload.find({
    collection: collectionSlug,
    limit: 0,
    locale,
    overrideAccess: false,
    sort,
    user,
    where: combineWhereConstraints(whereConstraints),
  })

  return {
    docs: result.docs.map((doc) => ({
      relationTo: collectionSlug,
      value: doc,
    })),
    hasMoreDocuments: Boolean(result.hasNextPage),
  }
}

export async function getFolderPolymorphicDocuments({
  collectionSlugs,
  locale,
  parentFolderID,
  payload,
  search,
  sort,
  user,
}: {
  collectionSlugs?: CollectionSlug[]
  locale?: string
  parentFolderID: number | string
  payload: Payload
  search?: string
  sort?: string
  user?: User
}): Promise<{
  docs: {
    relationTo: CollectionSlug
    value: any
  }[]
  hasMoreDocuments: boolean
}> {
  const whereConstraints: Where[] = [
    {
      relationTo: {
        not_equals: payload.config.folders.slug,
      },
    },
  ]

  if (search) {
    whereConstraints.push({
      'value._folderSearch': {
        contains: search,
      },
    })
  }

  if (collectionSlugs?.length) {
    whereConstraints.push({
      relationTo: {
        in: collectionSlugs,
      },
    })
  }

  // polymorphic queries must have parent folders
  const currentFolderQuery = await payload.find({
    collection: payload.config.folders.slug,
    joins: {
      documentsAndFolders: {
        limit: 100_000,
        sort: typeof sort === 'string' ? sort : '_folderSearch',
        where: combineWhereConstraints(whereConstraints),
      },
    },
    limit: 1,
    locale,
    overrideAccess: false,
    user,
    where: {
      id: {
        equals: parentFolderID,
      },
    },
  })

  return currentFolderQuery?.docs[0]?.documentsAndFolders ?? []
}
