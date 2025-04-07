import type { CollectionSlug, Payload, User, Where } from '../../index.js'

import { parseDocumentID } from '../../index.js'
import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js'

export async function getFolderDocuments({
  collectionSlugs,
  folderID,
  locale,
  payload,
  sort,
  user,
  where,
}: {
  collectionSlugs: CollectionSlug[]
  folderID?: number | string
  locale?: string
  payload: Payload
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
  const parentFolderID = folderID
    ? parseDocumentID({
        id: folderID,
        collectionSlug: payload.config.folders.slug,
        payload,
      })
    : undefined
  if (collectionSlugs.length) {
    if (collectionSlugs.length === 1) {
      // monomorphic query
      const collectionSlug = collectionSlugs[0]
      const result = await payload.find({
        collection: collectionSlug,
        limit: 0,
        locale,
        overrideAccess: false,
        sort,
        user,
        where: combineWhereConstraints([
          where,
          { _parentFolder: parentFolderID ? { equals: parentFolderID } : { exists: false } },
        ]),
      })
      return {
        docs: result.docs.map((doc) => ({
          relationTo: collectionSlug,
          value: doc,
        })),
        hasMoreDocuments: Boolean(result.hasNextPage),
      }
    } else if (parentFolderID) {
      // polymorphic queries must have parent folders
      const currentFolderQuery = await payload.find({
        collection: payload.config.folders.slug,
        joins: {
          documentsAndFolders: {
            limit: 100_000,
            sort: typeof sort === 'string' ? sort : '_folderSearch',
            where,
          },
        },
        limit: 1,
        locale,
        overrideAccess: false,
        user,
        where: {
          id: {
            equals: folderID,
          },
        },
      })

      return currentFolderQuery?.docs[0]?.documentsAndFolders ?? []
    }
  }

  return {
    docs: [],
    hasMoreDocuments: false,
  }
}
