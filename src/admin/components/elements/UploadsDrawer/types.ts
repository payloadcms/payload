import React, { HTMLAttributes } from 'react';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type UploadDrawerProps = {
  onSave?: (args: {
    doc: Record<string, unknown>
    collectionConfig: SanitizedCollectionConfig
  }) => void
  customHeader?: React.ReactNode
  drawerSlug?: string
}

export type UploadTogglerProps = HTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
  className?: string
  drawerSlug?: string
}

export type UseUploadDrawer = () => [
  React.FC<Omit<UploadDrawerProps, 'collectionSlug' | 'id'>>, // drawer
  React.FC<Omit<UploadTogglerProps, 'collectionSlug' | 'id'>>, // toggler
  {
    drawerSlug: string,
    drawerDepth: number
    isDrawerOpen: boolean
    toggleDrawer: () => void
  }
]
