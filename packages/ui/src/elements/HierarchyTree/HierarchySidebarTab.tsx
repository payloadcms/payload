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
    baseFilter?: Record<string, unknown>
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
  baseFilter,
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
    baseFilter: contextBaseFilter,
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

  const baseFilterKey = baseFilter ? JSON.stringify(baseFilter) : ''
  const contextBaseFilterKey = contextBaseFilter ? JSON.stringify(contextBaseFilter) : ''

  // Context has a newer baseFilter if it exists and differs from props
  const contextHasNewerBaseFilter =
    contextBaseFilter !== null && baseFilterKey !== contextBaseFilterKey

  // Skip stale initialData when context has a newer baseFilter
  const effectiveInitialData =
    treeRefreshKey === 0 && !contextHasNewerBaseFilter ? initialData : null

  const effectiveBaseFilter = contextHasNewerBaseFilter ? contextBaseFilter : baseFilter
  const effectiveBaseFilterKey = contextHasNewerBaseFilter ? contextBaseFilterKey : baseFilterKey

  const handleFilterChange = useCallback(
    (filters: string[]) => {
      setSelectedFiltersLocal(filters)
      setSelectedFiltersContext(filters)
    },
    [setSelectedFiltersContext],
  )

  const handleNavigateToParent = useCallback(
    ({ id }: { id: number | string }) => {
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
        baseFilter={contextHasNewerBaseFilter ? undefined : baseFilter}
        collectionSlug={hierarchyCollectionSlug}
        expandedNodes={initialExpandedNodes}
        parentFieldName={parentFieldName}
        selectedFilters={initialSelectedFilters}
        treeData={effectiveInitialData}
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
            baseFilter={effectiveBaseFilter}
            collectionSlug={hierarchyCollectionSlug}
            filterByCollections={selectedFilters.length > 0 ? selectedFilters : undefined}
            icon={icon}
            initialData={effectiveInitialData}
            key={`${hierarchyCollectionSlug}-${treeRefreshKey}-${effectiveBaseFilterKey}`}
            onNodeClick={handleNavigateToParent}
            selectedNodeId={selectedNodeId}
            useAsTitle={useAsTitle}
          />
        )}
      </div>
    </>
  )
}
