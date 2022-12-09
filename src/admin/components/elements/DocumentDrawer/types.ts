import React, { HTMLAttributes } from 'react';

export type DocumentDrawerProps = {
  collectionSlug: string
  id?: string
  onSave?: (json: Record<string, unknown>) => void
  customHeader?: React.ReactNode
  drawerSlug?: string
}

export type DocumentTogglerProps = HTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
  className?: string
  drawerSlug?: string
  id?: string
  collectionSlug: string
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
  }
]
