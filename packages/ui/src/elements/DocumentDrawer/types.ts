import type React from 'react'
import type { HTMLAttributes } from 'react'

import type { DocumentInfoContext } from '../../providers/DocumentInfo/types.js'
import type { Props as DrawerProps } from '../Drawer/types.js'

export type DocumentDrawerProps = Pick<DrawerProps, 'Header'> & {
  collectionSlug: string
  drawerSlug?: string
  id?: null | number | string
  onSave?: DocumentInfoContext['onSave']
}

export type DocumentTogglerProps = HTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
  className?: string
  collectionSlug: string
  disabled?: boolean
  drawerSlug?: string
  id?: string
}

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
