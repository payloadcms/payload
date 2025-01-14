import type { I18n } from '@payloadcms/translations'

import { getTranslation } from '@payloadcms/translations'

import type { CollectionSlug, PaginatedDocs, Payload, User } from '../../index.js'
import type {
  Breadcrumb,
  BreadcrumbsAndSubfolders,
  FolderEnabledColection,
  FolderInterface,
  Subfolder,
} from '../types.js'

import { createFolderConstraint } from './createFolderConstraint.js'

function buildBreadCrumbs(crumbs: Breadcrumb[], folder: FolderInterface): Breadcrumb[] {
  if (typeof folder === 'object' && folder !== null) {
    crumbs.push({
      id: folder.id,
      name: folder.name,
    })
  }

  if (folder && typeof folder.parentFolder === 'object' && folder.parentFolder !== null) {
    return buildBreadCrumbs(crumbs, folder.parentFolder)
  }

  return crumbs
}

type GetSubFoldersArgs = {
  collectionSlug: CollectionSlug
  folderCollectionSlug: CollectionSlug
  folderID: number | string
  payload: Payload
  user: User
}
async function getSubFolders({
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
          parentFolder: {
            equals: id,
          },
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

type Args = {
  collectionConfig: FolderEnabledColection
  folderID: number | string
  i18n: I18n
  payload: Payload
  user: User
}
export async function getBreadcrumbsAndSubFolders({
  collectionConfig,
  folderID,
  i18n,
  payload,
  user,
}: Args): Promise<BreadcrumbsAndSubfolders> {
  const collectionSlug = collectionConfig.slug
  const folderCollectionSlug = collectionConfig.admin.custom.folderCollectionSlug
  let breadcrumbs: Breadcrumb[] = []

  if (folderID) {
    // find folder with depth of 100 to get all parent folders
    const folderDoc = (await payload.findByID({
      id: folderID,
      collection: folderCollectionSlug,
      depth: 100,
      overrideAccess: false,
      user,
    })) as FolderInterface

    breadcrumbs = folderDoc ? buildBreadCrumbs([], folderDoc).reverse() : []
  }

  const collectionLabel = getTranslation(
    payload.collections[collectionSlug].config.labels.singular,
    i18n,
  )
  breadcrumbs.unshift({
    id: undefined,
    name: typeof collectionLabel === 'string' ? collectionLabel : collectionSlug,
  })

  return {
    breadcrumbs,
    subfolders: await getSubFolders({
      collectionSlug,
      folderCollectionSlug,
      folderID,
      payload,
      user,
    }),
  }
}
