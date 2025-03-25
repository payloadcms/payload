import type { User } from '../../index.js'
import type { Payload } from '../../types/index.js'
import type { GetFolderDataResult } from '../types.js'

import { buildFolderBreadcrumbs } from './buildFolderBreadcrumbs.js'
import { getFolderDocuments } from './getFolderDocuments.js'
import { getFolderSubfolders } from './getFolderSubfolders.js'

type Args = {
  docLimit?: number
  folderID: null | number | string
  page?: number
  payload: Payload
  search?: null | string
  user?: User
}

export const getFolderData = async ({
  docLimit,
  folderID: folderIDArg,
  page,
  payload,
  search,
  user,
}: Args): Promise<GetFolderDataResult> => {
  const folderID =
    folderIDArg && payload.db.defaultIDType === 'number'
      ? parseFloat(String(folderIDArg))
      : folderIDArg

  const breadcrumbs = buildFolderBreadcrumbs({
    folderID,
    payload,
  })

  const subfolders = getFolderSubfolders({
    folderID,
    payload,
    user,
  })

  // [?] @todo
  // should this query fetch using the join on the folderID
  // or should it continue to fetch each collection individually?
  const documents = folderID
    ? getFolderDocuments({
        folderID,
        limit: docLimit,
        page,
        payload,
        search,
        user,
      })
    : null

  const [resolvedBreadcrumbs, resolvedSubfolders, resolvedDocuments] = await Promise.all([
    breadcrumbs,
    subfolders,
    documents,
  ])

  const items: {
    relationTo: string
    value: any
  }[] = [...resolvedSubfolders, ...(resolvedDocuments?.docs || [])]

  return {
    breadcrumbs: resolvedBreadcrumbs,
    hasMoreDocuments: Boolean(resolvedDocuments?.hasMoreDocuments),
    items,
  }
}
