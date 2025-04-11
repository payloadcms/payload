import type { FolderBreadcrumb, GetFolderDataResult } from 'payload/shared'

import { type CollectionSlug, getFolderData, type PayloadRequest } from 'payload'

import { RenderServerComponent } from '../../../elements/RenderServerComponent/index.js'
import {
  MoveItemsToFolderRSC_ClientComponent,
  // This is important! https://github.com/payloadcms/payload/issues/12002#issuecomment-2791493587
  // eslint-disable-next-line payload/no-imports-from-exports-dir
} from '../../../exports/client/index.js'

type ClientRSCMoveToFolderViewProps = {
  breadcrumbs: FolderBreadcrumb[]
  drawerSlug: string
  folderID: number | string
  itemsToMove: {
    relationTo: CollectionSlug
    value: any
  }[]
  subfolders: GetFolderDataResult['subfolders']
}

export type GetMoveItemsToFolderDrawerContentArgs = {
  drawerSlug: string
  folderID: number | string
  itemsToMove: {
    relationTo: CollectionSlug
    value: any
  }[]
}
export type GetMoveItemsToFolderDrawerContentResult = Promise<{
  Component: React.ReactNode
}>

export async function getMoveItemsToFolderDrawerContent({
  drawerSlug,
  folderID,
  itemsToMove,
  req,
}: {
  req: PayloadRequest
} & GetMoveItemsToFolderDrawerContentArgs): GetMoveItemsToFolderDrawerContentResult {
  const { locale, payload, user } = req
  const { breadcrumbs, subfolders } = await getFolderData({
    type: 'monomorphic',
    collectionSlugs: [],
    folderID,
    locale,
    payload,
    user,
  })

  return {
    Component: RenderServerComponent({
      clientProps: {
        breadcrumbs,
        drawerSlug,
        folderID,
        itemsToMove,
        subfolders,
      } satisfies ClientRSCMoveToFolderViewProps,
      Component: MoveItemsToFolderRSC_ClientComponent,
      importMap: payload.importMap,
    }),
  }
}
