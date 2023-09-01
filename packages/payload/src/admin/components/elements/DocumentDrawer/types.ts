import type React from 'react';
import type { HTMLAttributes } from 'react';

import type { Props as EditViewProps } from '../../views/collections/Edit/types';

export type DocumentDrawerProps = {
  collectionSlug: string
  customHeader?: React.ReactNode
  drawerSlug?: string
  id?: string
  onSave?: EditViewProps['onSave']
}

export type DocumentTogglerProps = HTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
  className?: string
  collectionSlug: string
  disabled?: boolean
  drawerSlug?: string
  id?: string
}

export type UseDocumentDrawer = (args: {
  collectionSlug: string
  id?: string
}) => [
  React.FC<Omit<DocumentDrawerProps, 'collectionSlug' | 'id'>>, // drawer
  React.FC<Omit<DocumentTogglerProps, 'collectionSlug' | 'id'>>, // toggler
  {
    closeDrawer: () => void
    drawerDepth: number
    drawerSlug: string,
    isDrawerOpen: boolean
    openDrawer: () => void
    toggleDrawer: () => void
  }
]
