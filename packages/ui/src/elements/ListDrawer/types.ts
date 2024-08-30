import type { FilterOptionsResult, SanitizedCollectionConfig } from 'payload'
import type React from 'react'
import type { HTMLAttributes } from 'react'

import type { useSelection } from '../../providers/Selection/index.js'

export type ListDrawerProps = {
  readonly collectionSlugs: string[]
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
  readonly children?: React.ReactNode
  readonly className?: string
  readonly disabled?: boolean
  readonly drawerSlug?: string
} & Readonly<HTMLAttributes<HTMLButtonElement>>

export type UseListDrawer = (args: {
  readonly collectionSlugs?: string[]
  readonly filterOptions?: FilterOptionsResult
  readonly selectedCollection?: string
  readonly uploads?: boolean // finds all collections with upload: true
}) => [
  React.FC<Pick<ListDrawerProps, 'enableRowSelections' | 'onBulkSelect' | 'onSelect'>>, // drawer
  React.FC<Pick<ListTogglerProps, 'children' | 'className' | 'disabled'>>, // toggler
  {
    closeDrawer: () => void
    drawerDepth: number
    drawerSlug: string
    isDrawerOpen: boolean
    openDrawer: () => void
    toggleDrawer: () => void
  },
]
