import type { CollectionSlug, User } from '../../index.js'
import type { Payload, Where } from '../../types/index.js'
import type { GetFolderDataResult } from '../types.js'

import { buildFolderBreadcrumbs } from './buildFolderBreadcrumbs.js'
import { getFolderDocuments } from './getFolderDocuments.js'
import { getFolderSubfolders } from './getFolderSubfolders.js'

type Args = {
  collectionSlugs: CollectionSlug[]
  docSort?: string
  docWhere?: Where
  folderID?: number | string
  locale?: string
  payload: Payload
  user?: User
}

export const getFolderData = async ({
  collectionSlugs,
  docSort,
  docWhere,
  folderID: folderIDArg,
  locale,
  payload,
  user,
}: Args): Promise<GetFolderDataResult> => {
  const folderID =
    folderIDArg && payload.db.defaultIDType === 'number'
      ? parseFloat(String(folderIDArg))
      : folderIDArg

  const breadcrumbs = buildFolderBreadcrumbs({
    folderID,
    payload,
    user,
  })

  const subfolders = getFolderSubfolders({
    folderID,
    payload,
    user,
  })

  const documents = getFolderDocuments({
    collectionSlugs,
    folderID,
    locale,
    payload,
    sort: docSort,
    user,
    where: docWhere,
  })

  const [resolvedBreadcrumbs, resolvedSubfolders, resolvedDocuments] = await Promise.all([
    breadcrumbs,
    subfolders,
    documents,
  ])

  return {
    breadcrumbs: resolvedBreadcrumbs,
    documents: resolvedDocuments?.docs || [],
    hasMoreDocuments: Boolean(resolvedDocuments?.hasMoreDocuments),
    subfolders: resolvedSubfolders || [],
  }
}
