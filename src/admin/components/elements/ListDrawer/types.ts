import React, { HTMLAttributes } from 'react';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type ListDrawerProps = {
  onSave?: (args: {
    doc: Record<string, unknown>
    collectionConfig: SanitizedCollectionConfig
  }) => void
  customHeader?: React.ReactNode
  drawerSlug?: string
  collectionSlugs?: string[]
  uploads?: boolean
}

export type ListTogglerProps = HTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
  className?: string
  drawerSlug?: string
}

export type UseListDrawer = (args: {
  collectionSlugs?: string[]
  uploads?: boolean // finds all collections with upload: true
}) => [
  React.FC<Omit<ListDrawerProps, 'collectionSlug' | 'id'>>, // drawer
  React.FC<Omit<ListTogglerProps, 'collectionSlug' | 'id'>>, // toggler
  {
    drawerSlug: string,
    drawerDepth: number
    isDrawerOpen: boolean
    toggleDrawer: () => void
  }
]
