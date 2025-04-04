import type { CollectionSlug, PaginatedDocs, Payload, User } from 'payload'

import type { FolderInterface, Subfolder } from '../types.js'

import { createFolderConstraint } from './createFolderConstraint.js'

type GetSubFoldersArgs = {
  /**
   * The collection slug for the documents inside the folder
   */
  collectionSlug: CollectionSlug
  /**
   * The collection slug of the folder collection
   */
  folderCollectionSlug: CollectionSlug
  /**
   * The ID of the folder
   */
  folderID: number | string
  payload: Payload
  user: User
}
export async function getSubFolders({
  collectionSlug,
  folderCollectionSlug,
  folderID,
  payload,
  user,
}: GetSubFoldersArgs) {
  // find sub folders
  const foldersQuery = (await payload.find({
    collection: folderCollectionSlug,
    overrideAccess: false,
    sort: 'name',
    user,
    where: createFolderConstraint({ folderID }),
  })) as PaginatedDocs<FolderInterface>

  // calculate subfolder data
  const subfolders: Subfolder[] = []
  await Promise.all(
    foldersQuery.docs.map(async ({ id, name }, i) => {
      const subfoldersQuery = await payload.count({
        collection: folderCollectionSlug,
        depth: 0,
        where: {
          parentFolder: {
            equals: id,
          },
        },
      })

      const subfoldersFilesQuery = await payload.count({
        collection: collectionSlug,
        depth: 0,
        where: {
          and: [
            {
              parentFolder: {
                exists: true,
              },
            },
            {
              parentFolder: {
                equals: id,
              },
            },
          ],
        },
      })

      subfolders[i] = {
        id,
        name,
        fileCount: subfoldersFilesQuery.totalDocs,
        hasSubfolders: subfoldersQuery.totalDocs > 0,
        subfolderCount: subfoldersQuery.totalDocs,
      }
    }),
  )

  return subfolders
}
