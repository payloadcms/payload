'use client'

import type { SidebarTabClientProps } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useState } from 'react'

import type { HierarchyInitialData } from './types.js'

import { HierarchySearch } from '../../elements/HierarchySearch/index.js'
import { HydrateHierarchyProvider } from '../../elements/HydrateHierarchyProvider/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useHierarchy } from '../../providers/Hierarchy/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { HierarchyTree } from './index.js'

export const HierarchySidebarTab: React.FC<
  {
    collectionSpecificOptions?: { label: string; value: string }[]
    hierarchyCollectionSlug: string
    icon?: React.ReactNode
    initialData?: HierarchyInitialData | null
    initialExpandedNodes?: (number | string)[]
    initialSelectedFilters?: string[]
    parentFieldName?: string
    selectedNodeId?: null | string
    treeLimit?: number
    typeFieldName?: string
    useAsTitle?: string
  } & SidebarTabClientProps
> = ({
  collectionSpecificOptions,
  hierarchyCollectionSlug,
  icon,
  initialData,
  initialExpandedNodes,
  initialSelectedFilters,
  parentFieldName,
  selectedNodeId: selectedNodeIdFromServer,
  treeLimit,
  typeFieldName,
  useAsTitle,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [selectedFilters, setSelectedFiltersLocal] = useState<string[]>(
    initialSelectedFilters ?? [],
  )
  const {
    setSelectedFilters: setSelectedFiltersContext,
    treeRefreshKey,
    viewCollectionSlug,
  } = useHierarchy()

  // Only show selection if the current list view matches this tab's hierarchy collection
  const parentParam = searchParams.get('parent')
  const isViewingThisCollection = viewCollectionSlug === hierarchyCollectionSlug
  const selectedNodeId = isViewingThisCollection
    ? (parentParam ?? selectedNodeIdFromServer ?? undefined)
    : undefined

  const handleFilterChange = useCallback(
    (filters: string[]) => {
      setSelectedFiltersLocal(filters)
      setSelectedFiltersContext(filters)
    },
    [setSelectedFiltersContext],
  )

  const handleNavigateToParent = useCallback(
    (id: number | string) => {
      const url = formatAdminURL({
        adminRoute,
        path: `/collections/${hierarchyCollectionSlug}?parent=${id}`,
      })
      startRouteTransition(() => {
        router.push(url)
        router.refresh()
      })
    },
    [adminRoute, hierarchyCollectionSlug, router, startRouteTransition],
  )

  return (
    <>
      <HydrateHierarchyProvider
        collectionSlug={hierarchyCollectionSlug}
        expandedNodes={initialExpandedNodes}
        parentFieldName={parentFieldName}
        selectedFilters={initialSelectedFilters}
        treeData={initialData}
        treeLimit={treeLimit}
        typeFieldName={typeFieldName}
      />
      <div className="hierarchy-sidebar-tab">
        <HierarchySearch
          collectionSlug={hierarchyCollectionSlug}
          collectionSpecificOptions={collectionSpecificOptions}
          isActive={isSearchActive}
          onActiveChange={setIsSearchActive}
          onFilterChange={handleFilterChange}
          onSelect={handleNavigateToParent}
          selectedFilters={selectedFilters}
        />
        {!isSearchActive && (
          <HierarchyTree
            collectionSlug={hierarchyCollectionSlug}
            filterByCollections={selectedFilters.length > 0 ? selectedFilters : undefined}
            icon={icon}
            initialData={initialData}
            key={`${hierarchyCollectionSlug}-${treeRefreshKey}`}
            onNodeClick={handleNavigateToParent}
            selectedNodeId={selectedNodeId}
            useAsTitle={useAsTitle}
          />
        )}
      </div>
    </>
  )
}
