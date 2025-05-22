import type { User } from '../../index.js'
import type { Document, Payload } from '../../types/index.js'
import type { FolderBreadcrumb } from '../types.js'

type GetFolderBreadcrumbsArgs = {
  breadcrumbs?: FolderBreadcrumb[]
  folderID?: number | string
  payload: Payload
  user?: User
}
/**
 * Builds breadcrumbs up from child folder
 * all the way up to root folder
 */
export const getFolderBreadcrumbs = async ({
  breadcrumbs = [],
  folderID,
  payload,
  user,
}: GetFolderBreadcrumbsArgs): Promise<FolderBreadcrumb[] | null> => {
  const folderFieldName: string = payload.config.folders.fieldName
  if (folderID) {
    const folderQuery = await payload.find({
      collection: payload.config.folders.slug,
      depth: 0,
      limit: 1,
      overrideAccess: false,
      select: {
        name: true,
        [folderFieldName]: true,
      },
      user,
      where: {
        id: {
          equals: folderID,
        },
      },
    })

    const folder = folderQuery.docs[0] as Document

    if (folder) {
      breadcrumbs.push({
        id: folder.id,
        name: folder.name,
      })
      if (folder[folderFieldName]) {
        return getFolderBreadcrumbs({
          breadcrumbs,
          folderID:
            typeof folder[folderFieldName] === 'number' ||
            typeof folder[folderFieldName] === 'string'
              ? folder[folderFieldName]
              : folder[folderFieldName].id,
          payload,
          user,
        })
      }
    }
  }

  return breadcrumbs.reverse()
}
