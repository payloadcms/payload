import React, { HTMLAttributes } from 'react';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type DocumentDrawerProps = {
  collectionSlug: string
  id?: string
  onSave?: (args: {
    doc: Record<string, any>
    collectionConfig: SanitizedCollectionConfig
    message: string,
  }) => void
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
