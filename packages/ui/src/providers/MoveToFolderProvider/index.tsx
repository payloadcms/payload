import type { ReactNode } from 'react'

import React, { createContext, use } from 'react'

import type { MoveToFolderDrawerProps } from '../../elements/FolderView/Drawers/MoveToFolder/index.js'

import { MoveItemsToFolderDrawer } from '../../elements/FolderView/Drawers/MoveToFolder/index.js'

type ActionPayload = MoveToFolderDrawerProps

type Action = { payload: ActionPayload; type: 'INITIALIZE' } | { type: 'CLEAR' }

interface MoveToFolderContextType {
  dispatch: React.Dispatch<Action>
}

const MoveToFolderContext = createContext<MoveToFolderContextType | undefined>(undefined)
const initialState: ActionPayload = {
  action: 'moveItemToFolder',
  drawerSlug: 'move-doc-to-folder',
  fromFolderID: null,
  fromFolderName: null,
  itemsToMove: [],
  onConfirm: () => Promise.resolve(),
  skipConfirmModal: false,
  title: null,
}

const reducer = (state: typeof initialState, action: Action) => {
  switch (action.type) {
    case 'CLEAR':
      return initialState

    case 'INITIALIZE':
      return action.payload
    default:
      return state
  }
}
export const MoveToFolderDrawerProvider = ({ children }: { children: ReactNode }) => {
  const [drawerProps, dispatch] = React.useReducer(reducer, initialState)

  return (
    <MoveToFolderContext value={{ dispatch }}>
      {children}
      <MoveItemsToFolderDrawer {...drawerProps} />
    </MoveToFolderContext>
  )
}

export const useMoveToFolderDrawer = () => {
  const context = use(MoveToFolderContext)
  if (!context) {
    throw new Error('useMoveToFolder must be used within a MoveToFolderProvider')
  }
  return context
}
