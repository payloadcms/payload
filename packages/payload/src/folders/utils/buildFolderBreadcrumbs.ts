import type { PaginatedDocs } from '../../database/types.js'
import type { User } from '../../index.js'
import type { Payload } from '../../types/index.js'
import type { FolderBreadcrumb, FolderInterface } from '../types.js'

import { foldersSlug, parentFolderFieldName } from '../constants.js'
type BuildFolderBreadcrumbsArgs = {
  breadcrumbs?: FolderBreadcrumb[]
  folderID?: number | string
  payload: Payload
  user?: User
}
/**
 * Builds breadcrumbs up from child folder
 * all the way up to root folder
 */
export const buildFolderBreadcrumbs = async ({
  breadcrumbs = [],
  folderID,
  payload,
  user,
}: BuildFolderBreadcrumbsArgs): Promise<FolderBreadcrumb[] | null> => {
  if (folderID) {
    const folderQuery = (await payload.find({
      collection: foldersSlug,
      depth: 0,
      limit: 1,
      overrideAccess: false,
      select: {
        name: true,
        [parentFolderFieldName]: true,
      },
      user,
      where: {
        id: {
          equals: folderID,
        },
      },
    })) as PaginatedDocs<FolderInterface>

    const folder = folderQuery.docs[0]

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
  }

  return breadcrumbs.reverse()
}
