import type { FilterOptionsResult, SanitizedCollectionConfig } from 'payload'
import type React from 'react'
import type { HTMLAttributes } from 'react'

export type ListDrawerProps = {
  collectionSlugs: string[]
  customHeader?: React.ReactNode
  drawerSlug?: string
  filterOptions?: FilterOptionsResult
  onSelect?: (args: { collectionSlug: SanitizedCollectionConfig['slug']; docID: string }) => void
  selectedCollection?: string
}

export type ListTogglerProps = {
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  drawerSlug?: string
} & HTMLAttributes<HTMLButtonElement>

export type UseListDrawer = (args: {
  collectionSlugs?: string[]
  filterOptions?: FilterOptionsResult
  selectedCollection?: string
  uploads?: boolean // finds all collections with upload: true
}) => [
  React.FC<Pick<ListDrawerProps, 'onSelect'>>, // drawer
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
