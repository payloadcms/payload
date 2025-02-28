import type { PaginatedDocs } from '../../database/types.js'
import type { Payload } from '../../types/index.js'
import type { FolderBreadcrumb, FolderInterface } from '../types.js'

import { foldersSlug, parentFolderFieldName } from '../constants.js'
type BuildFolderBreadcrumbsArgs = {
  breadcrumbs?: FolderBreadcrumb[]
  folderID: null | number | string
  payload: Payload
}
export const buildFolderBreadcrumbs = async ({
  breadcrumbs = [],
  folderID,
  payload,
}: BuildFolderBreadcrumbsArgs): Promise<FolderBreadcrumb[]> => {
  const folderQuery = (await payload.find({
    collection: foldersSlug,
    depth: 0,
    limit: 2,
    select: {
      name: true,
      isRoot: true,
      [parentFolderFieldName]: true,
    },
    where: {
      or: [
        {
          and: [
            {
              id: {
                equals: folderID,
              },
            },
            {
              isRoot: {
                equals: false,
              },
            },
          ],
        },
        {
          isRoot: {
            equals: true,
          },
        },
      ],
    },
  })) as PaginatedDocs<FolderInterface>

  const { folder, rootFolder } = folderQuery.docs.reduce<{
    folder: FolderInterface | null
    rootFolder: FolderInterface | null
  }>(
    (acc, folder) => {
      if (folder.isRoot) {
        acc.rootFolder = folder
      } else {
        acc.folder = folder
      }
      return acc
    },
    { folder: null, rootFolder: null },
  )

  if (folder) {
    breadcrumbs.push({
      id: folder.id,
      name: folder.name,
    })
    if (folder[parentFolderFieldName]) {
      return buildFolderBreadcrumbs({
        breadcrumbs,
        folderID:
          typeof folder[parentFolderFieldName] === 'number' ||
          typeof folder[parentFolderFieldName] === 'string'
            ? folder[parentFolderFieldName]
            : folder[parentFolderFieldName].id,
        payload,
      })
    }
  }

  if (rootFolder) {
    breadcrumbs.push({
      id: rootFolder.id,
      name: rootFolder.name,
    })
  }
  return breadcrumbs.reverse()
}
