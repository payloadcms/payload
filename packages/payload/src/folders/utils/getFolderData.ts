import type { Payload } from '../../types/index.js'
import type { GetFolderDataResult } from '../types.js'

import { foldersSlug } from '../constants.js'
import { buildFolderBreadcrumbs } from './buildFolderBreadcrumbs.js'
import { getFolderDocuments } from './getFolderDocuments.js'
import { getFolderSubfolders } from './getFolderSubfolders.js'

type Args = {
  folderID: null | string
  payload: Payload
}

export const getFolderData = async ({
  folderID: folderIDArg,
  payload,
}: Args): Promise<GetFolderDataResult> => {
  const folderID =
    folderIDArg && payload.db.defaultIDType === 'number' ? parseFloat(folderIDArg) : folderIDArg
  const folderEnabledCollectionSlugs = (payload.config.collections || [])
    .filter((collection) => collection.admin.enableFolders)
    .map((collection) => collection.slug)

  const breadcrumbs = buildFolderBreadcrumbs({
    folderID,
    payload,
  })

  const subfolders = getFolderSubfolders({
    folderID,
    payload,
  })

  // [?] @todo
  // should this query fetch using the join on the folderID
  // or should it continue to fetch each collection individually?
  const documents = getFolderDocuments({
    folderID,
    payload,
    relationTo: folderEnabledCollectionSlugs,
  })

  const [resolvedBreadcrumbs, resolvedSubfolders, resolvedDocuments] = await Promise.all([
    breadcrumbs,
    subfolders,
    documents,
  ])

  const items: {
    relationTo: string
    value: any
  }[] = []

  resolvedSubfolders.forEach((subfolder) => {
    items.push({
      relationTo: foldersSlug,
      value: subfolder,
    })
  })

  items.push(...resolvedDocuments)

  return {
    breadcrumbs: resolvedBreadcrumbs,
    items,
  }
}
