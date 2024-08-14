import type React from 'react'
import type { HTMLAttributes } from 'react'

import type { DocumentInfoContext } from '../../providers/DocumentInfo/types.js'
import type { Props as DrawerProps } from '../Drawer/types.js'

export type DocumentDrawerProps = {
  readonly collectionSlug: string
  readonly drawerSlug?: string
  readonly id?: null | number | string
  readonly onCreate?: DocumentInfoContext['onCreate']
  readonly onDelete?: DocumentInfoContext['onDelete']
  readonly onDuplicate?: DocumentInfoContext['onDuplicate']
  readonly onSave?: DocumentInfoContext['onSave']
  readonly redirectAfterDelete?: boolean
  readonly redirectAfterDuplicate?: boolean
} & Pick<DrawerProps, 'Header'>

export type DocumentTogglerProps = {
  readonly children?: React.ReactNode
  readonly className?: string
  readonly collectionSlug: string
  readonly disabled?: boolean
  readonly drawerSlug?: string
  readonly id?: string
} & HTMLAttributes<HTMLButtonElement>

export type UseDocumentDrawer = (args: { collectionSlug: string; id?: number | string }) => [
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
