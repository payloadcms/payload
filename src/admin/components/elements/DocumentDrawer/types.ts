import React, { HTMLAttributes } from 'react';
import { Props as EditViewProps } from '../../views/collections/Edit/types';

export type DocumentDrawerProps = {
  collectionSlug: string
  id?: string
  onSave?: EditViewProps['onSave']
  customHeader?: React.ReactNode
  drawerSlug?: string
}

export type DocumentTogglerProps = HTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
  className?: string
  drawerSlug?: string
  id?: string
  collectionSlug: string
  disabled?: boolean
}

export type UseDocumentDrawer = (args: {
  id?: string
  collectionSlug: string
}) => [
  React.FC<Omit<DocumentDrawerProps, 'collectionSlug' | 'id'>>, // drawer
  React.FC<Omit<DocumentTogglerProps, 'collectionSlug' | 'id'>>, // toggler
  {
    drawerSlug: string,
    drawerDepth: number
    isDrawerOpen: boolean
    toggleDrawer: () => void
    closeDrawer: () => void
    openDrawer: () => void
  }
]
