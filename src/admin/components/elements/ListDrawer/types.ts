import React, { HTMLAttributes } from 'react';
import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { FilterOptionsResult } from '../../forms/field-types/Relationship/types';

export type ListDrawerProps = {
  onSelect?: (args: {
    docID: string
    collectionConfig: SanitizedCollectionConfig
  }) => void
  customHeader?: React.ReactNode
  drawerSlug?: string
  collectionSlugs: string[]
  selectedCollection?: string
  filterOptions?: FilterOptionsResult
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
  filterOptions?: FilterOptionsResult
}) => [
    React.FC<Pick<ListDrawerProps, 'onSelect'>>, // drawer
    React.FC<Pick<ListTogglerProps, 'disabled' | 'className' | 'children'>>, // toggler
    {
      drawerSlug: string,
      drawerDepth: number
      isDrawerOpen: boolean
      toggleDrawer: () => void
      closeDrawer: () => void
      openDrawer: () => void
    }
  ]
