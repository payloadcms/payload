import type { FilterOptionsResult, SanitizedCollectionConfig } from 'payload'
import type React from 'react'
import type { HTMLAttributes } from 'react'

import type { useSelection } from '../../providers/Selection/index.js'

export type ListDrawerProps = {
  readonly collectionSlugs: SanitizedCollectionConfig['slug'][]
  readonly customHeader?: React.ReactNode
  readonly drawerSlug?: string
  readonly enableRowSelections?: boolean
  readonly filterOptions?: FilterOptionsResult
  readonly onBulkSelect?: (selected: ReturnType<typeof useSelection>['selected']) => void
  readonly onSelect?: (args: {
    collectionSlug: SanitizedCollectionConfig['slug']
    docID: string
  }) => void
  readonly selectedCollection?: string
}

export type ListTogglerProps = {
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  drawerSlug?: string
} & HTMLAttributes<HTMLButtonElement>

export type UseListDrawer = (args: {
  collectionSlugs?: SanitizedCollectionConfig['slug'][]
  filterOptions?: FilterOptionsResult
  selectedCollection?: SanitizedCollectionConfig['slug']
  uploads?: boolean // finds all collections with upload: true
}) => [
  React.FC<Pick<ListDrawerProps, 'enableRowSelections' | 'onBulkSelect' | 'onSelect'>>, // drawer
  React.FC<Pick<ListTogglerProps, 'children' | 'className' | 'disabled'>>, // toggler
  {
    closeDrawer: () => void
    collectionSlugs: SanitizedCollectionConfig['slug'][]
    drawerDepth: number
    drawerSlug: string
    isDrawerOpen: boolean
    openDrawer: () => void
    setCollectionSlugs: React.Dispatch<React.SetStateAction<SanitizedCollectionConfig['slug'][]>>
    toggleDrawer: () => void
  },
]
