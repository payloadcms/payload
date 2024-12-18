import type { I18n } from '@payloadcms/translations'

import { getTranslation } from '@payloadcms/translations'

import type { CollectionSlug, PaginatedDocs, Payload, User, Where } from '../../index.js'
import type {
  Breadcrumb,
  FolderAndDocumentsResult,
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

type DataArgs = {
  collectionConfig: FolderEnabledColection
  fileCollectionSlug: CollectionSlug
  folderID: number | string
  i18n: I18n
  limit?: number
  locale?: string
  payload: Payload
  sort?: string
  user: User
  where?: Where
}
export async function populateFolderData({
  fileCollectionSlug,
  folderID,
  limit = 100,
  payload,
  sort = 'name',
  user,
  where,
}: DataArgs): Promise<PaginatedDocs> {
  const fileWhere = createFolderConstraint({ folderID })

  const data = await payload.find({
    collection: fileCollectionSlug,
    depth: 0,
    draft: true,
    fallbackLocale: null,
    limit,
    locale: 'all',
    overrideAccess: false,
    sort,
    user,
    where: {
      and: [fileWhere, where || {}],
    },
  })

  return data
}

type Args = {
  collectionConfig: FolderEnabledColection
  folderID: number | string
  i18n: I18n
  payload: Payload
  user: User
  withDocs?: boolean
}
export async function populateFolderAndData({
  collectionConfig,
  folderID,
  i18n,
  payload,
  user,
  withDocs = true,
}: Args): Promise<FolderAndDocumentsResult> {
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

  let data: PaginatedDocs | undefined

  if (withDocs) {
    data = await populateFolderData({
      collectionConfig,
      fileCollectionSlug: collectionSlug,
      folderID,
      i18n,
      payload,
      user,
    })
  }

  return {
    breadcrumbs,
    data,
    subfolders: await getSubFolders({
      collectionSlug,
      folderCollectionSlug,
      folderID,
      payload,
      user,
    }),
  }
}
