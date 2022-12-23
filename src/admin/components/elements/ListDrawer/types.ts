import React, { HTMLAttributes } from 'react';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';

export type ListDrawerProps = {
  onSelect?: (args: {
    docID: string
    collectionConfig: SanitizedCollectionConfig
  }) => void
  customHeader?: React.ReactNode
  drawerSlug?: string
  collectionSlugs?: string[]
  uploads?: boolean
  selectedCollection?: string
}

export type ListTogglerProps = HTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode
  className?: string
  drawerSlug?: string
  disabled?: boolean
}

export type UseListDrawer = (args: {
  collectionSlugs?: string[]
  selectedCollection?: string
  uploads?: boolean // finds all collections with upload: true
}) => [
  React.FC<Omit<ListDrawerProps, 'collectionSlug' | 'id'>>, // drawer
  React.FC<Omit<ListTogglerProps, 'collectionSlug' | 'id'>>, // toggler
  {
    drawerSlug: string,
    drawerDepth: number
    isDrawerOpen: boolean
    toggleDrawer: () => void
    closeDrawer: () => void
    openDrawer: () => void
  }
]
