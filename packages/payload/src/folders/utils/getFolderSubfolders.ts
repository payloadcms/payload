import type { PaginatedDocs, User } from '../../index.js'
import type { Payload, Where } from '../../types/index.js'
import type { FolderInterface } from '../types.js'

import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js'

type GetSubfoldersArgs = {
  parentFolderID?: number | string
  payload: Payload
  search?: string
  user?: User
}
export const getFolderSubfolders = async ({
  parentFolderID,
  payload,
  search,
  user,
}: GetSubfoldersArgs): Promise<
  {
    relationTo: string
    value: FolderInterface
  }[]
> => {
  const whereConstraints: Where[] = []

  if (search) {
    whereConstraints.push({
      name: {
        contains: search,
      },
    })
  }

  if (parentFolderID) {
    whereConstraints.push({
      relationTo: {
        equals: payload.config.folders.slug,
      },
    })

    const subfolderDocs = (await payload.find({
      collection: payload.config.folders.slug,
      joins: {
        documentsAndFolders: {
          limit: 100_000,
          sort: 'name',
          where: combineWhereConstraints(whereConstraints),
        },
      },
      limit: 1,
      // overrideAccess: false, // @todo: bug in core, throws "QueryError: The following paths cannot be queried: relationTo"
      user,
      where: {
        id: {
          equals: parentFolderID,
        },
      },
    })) as PaginatedDocs<FolderInterface>

    return subfolderDocs?.docs[0]?.documentsAndFolders?.docs || []
  }

  whereConstraints.push({
    _parentFolder: {
      exists: false,
    },
  })

  const orphanedFolders = (await payload.find({
    collection: payload.config.folders.slug,
    limit: 0,
    overrideAccess: false,
    sort: 'name',
    user,
    where: combineWhereConstraints(whereConstraints),
  })) as PaginatedDocs<FolderInterface>

  const orphanedDocsWithRelation = orphanedFolders?.docs.map((folder) => ({
    relationTo: payload.config.folders.slug,
    value: folder,
  }))

  return orphanedDocsWithRelation || []
}
