'use client'

import React, { createContext, use } from 'react'

import type {
  GetMoveItemsToFolderDrawerContentArgs,
  GetMoveItemsToFolderDrawerContentResult,
} from '../../../../providers/ServerFunctions/MoveItemsToFolder/serverFunction.js'
import type { PolymorphicRelationshipValue } from '../../types.js'

import { useServerFunctions } from '../../../../providers/ServerFunctions/index.js'
import { getMoveItemsToFolderDrawerContentKey } from '../../../../providers/ServerFunctions/MoveItemsToFolder/_key.js'
import { Drawer } from '../../../Drawer/index.js'
import './index.scss'

type Props = {
  readonly drawerSlug: string
  readonly folderID: number | string
  readonly itemsToMove: PolymorphicRelationshipValue[]
  readonly onConfirm: (folderID: number | string) => Promise<void> | void
}
/**
 * This component renders a drawer. The children for the drawer comes from
 * the response of a server function, the sever function returns a component
 * that _uses_ the `<MoveItemsToFolderDrawerContent />` component.
 */
export function MoveItemsToFolderDrawer({ drawerSlug, folderID, itemsToMove, onConfirm }: Props) {
  const [ViewToRender, setViewToRender] = React.useState(null)
  const { serverFunction } = useServerFunctions()
  const loadedRef = React.useRef(false)

  React.useEffect(() => {
    async function loadInitialDrawerContent() {
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
      loadedRef.current = true
      setViewToRender(Component)
    }

    if (loadedRef.current) {
      return
    }
    void loadInitialDrawerContent()
  }, [drawerSlug, folderID, itemsToMove, serverFunction])

  return (
    <Drawer gutter={false} Header={null} slug={drawerSlug}>
      <MoveItemsToFolderProvider onConfirm={onConfirm}>{ViewToRender}</MoveItemsToFolderProvider>
    </Drawer>
  )
}

type MoveItemsToFolderContextType = {
  onConfirm: (folderID: number | string) => Promise<void> | void
}

const MoveItemsToFolderContext = createContext<MoveItemsToFolderContextType | undefined>(undefined)

export const MoveItemsToFolderProvider: React.FC<{
  children: React.ReactNode
  onConfirm: (folderID: number | string) => Promise<void> | void
}> = ({ children, onConfirm }) => {
  return <MoveItemsToFolderContext value={{ onConfirm }}>{children}</MoveItemsToFolderContext>
}

export const useMoveItemsToFolder = (): MoveItemsToFolderContextType => {
  const context = use(MoveItemsToFolderContext)
  if (!context) {
    throw new Error('useMoveItemsToFolder must be used within a MoveItemsToFolderProvider')
  }
  return context
}
