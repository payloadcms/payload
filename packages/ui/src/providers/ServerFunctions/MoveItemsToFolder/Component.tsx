'use client'

import type { FolderBreadcrumb, GetFolderDataResult } from 'payload/shared'

import React from 'react'

import type {
  GetMoveItemsToFolderDrawerContentArgs,
  GetMoveItemsToFolderDrawerContentResult,
} from './serverFunction.js'

import { MoveItemsToFolderDrawerContent } from '../../../elements/FolderView/Drawers/MoveToFolder/DrawerContent.js'
import { useMoveItemsToFolder } from '../../../elements/FolderView/Drawers/MoveToFolder/index.js'
import { useServerFunctions } from '../index.js'
import { getMoveItemsToFolderDrawerContentKey } from './_key.js'

type ClientComponentProps = {
  breadcrumbs: FolderBreadcrumb[]
  drawerSlug: string
  folderID: number | string
  itemsToMove: (GetFolderDataResult['documents'][0] | GetFolderDataResult['subfolders'][0])[]
  subfolders: GetFolderDataResult['subfolders']
}
/**
 * This is a recursive component. It renders the first time
 * and then when the user navigates to a new folder, it goes back
 * to the server to render the component (this component, but with new data).
 */
export function MoveItemsToFolderRSC_ClientComponent({
  breadcrumbs,
  drawerSlug,
  folderID: _folderID,
  itemsToMove,
  subfolders,
}: ClientComponentProps) {
  const [ViewFromServerFunction, setViewFromServerFunction] = React.useState(null)
  const { onConfirm } = useMoveItemsToFolder()
  const { serverFunction } = useServerFunctions()

  /**
   * This function is called when the user navigates to a new folder.
   *
   * It calls the server function to rebuild THIS component with the new data.
   * The returned component will then be rendered in the drawer.
   */
  const onNavigateToFolder = React.useCallback(
    async ({ folderID }) => {
      const { Component } = await serverFunction<
        GetMoveItemsToFolderDrawerContentArgs,
        GetMoveItemsToFolderDrawerContentResult
      >({
        name: getMoveItemsToFolderDrawerContentKey,
        args: {
          drawerSlug,
          folderID,
          itemsToMove,
        },
      })
      setViewFromServerFunction(Component)
    },
    [drawerSlug, itemsToMove, serverFunction],
  )

  if (ViewFromServerFunction) {
    return ViewFromServerFunction
  }

  return (
    <MoveItemsToFolderDrawerContent
      breadcrumbs={breadcrumbs}
      drawerSlug={drawerSlug}
      folderID={_folderID}
      itemsToMove={itemsToMove}
      onMoveConfirm={onConfirm}
      onNavigateToFolder={onNavigateToFolder}
      subfolders={subfolders}
    />
  )
}
