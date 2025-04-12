import type { Data, FormState } from 'payload'
import type React from 'react'
import type { HTMLAttributes } from 'react'

import type { Props as DrawerProps } from '../Drawer/types.js'
import type { DocumentDrawerContextProps } from './Provider.js'

export type DocumentDrawerProps = {
  readonly AfterFields?: React.ReactNode
  readonly collectionSlug: string
  readonly disableActions?: boolean
  readonly drawerSlug?: string
  readonly id?: null | number | string
  readonly initialData?: Data
  /**
   * @deprecated
   */
  readonly initialState?: FormState
  readonly overrideEntityVisibility?: boolean
  readonly redirectAfterCreate?: boolean
  readonly redirectAfterDelete?: boolean
  readonly redirectAfterDuplicate?: boolean
} & Pick<DocumentDrawerContextProps, 'onDelete' | 'onDuplicate' | 'onSave'> &
  Pick<DrawerProps, 'Header'>

export type DocumentTogglerProps = {
  readonly children?: React.ReactNode
  readonly className?: string
  readonly collectionSlug: string
  readonly disabled?: boolean
  readonly drawerSlug?: string
  readonly id?: string
  readonly onClick?: () => void
} & Readonly<HTMLAttributes<HTMLButtonElement>>

export type UseDocumentDrawer = (args: {
  collectionSlug: string
  id?: number | string
  overrideEntityVisibility?: boolean
}) => [
  React.FC<Omit<DocumentDrawerProps, 'collectionSlug' | 'id'>>, // drawer
  React.FC<Omit<DocumentTogglerProps, 'collectionSlug' | 'id'>>, // toggler
  {
    closeDrawer: () => void
    drawerDepth: number
    drawerSlug: string
    isDrawerOpen: boolean
    openDrawer: () => void
    toggleDrawer: () => void
  },
]
