'use client'

import type { SidebarTabClientProps } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { HierarchyInitialData } from './types.js'

import { useConfig } from '../../../providers/Config/index.js'
import { useHierarchy } from '../../../providers/Hierarchy/index.js'
import { useRouteTransition } from '../../../providers/RouteTransition/index.js'
import { useSidebarTabs } from '../../../providers/SidebarTabs/index.js'
import { HydrateHierarchyProvider } from '../HydrateProvider/index.js'
import { HierarchySearch } from '../Search/index.js'
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
  const { setSelectedFilters: setSelectedFiltersContext, treeRefreshKeys } = useHierarchy()
  const sidebarTabs = useSidebarTabs()

  // When refreshTree(slug) is called from the list view (e.g. after mutations), reload this tab.
  // Always reload regardless of active state so inactive tabs are fresh when switched to.
  const tabSlug = `hierarchy-${hierarchyCollectionSlug}`
  const treeRefreshKey = treeRefreshKeys.get(hierarchyCollectionSlug) ?? 0
  const prevTreeRefreshKeyRef = useRef(treeRefreshKey)
  useEffect(() => {
    if (prevTreeRefreshKeyRef.current !== treeRefreshKey) {
      prevTreeRefreshKeyRef.current = treeRefreshKey
      sidebarTabs?.reloadTabContent(tabSlug)
    }
  }, [treeRefreshKey, sidebarTabs, tabSlug])

  // Only highlight selected node when this tab is active
  const parentParam = searchParams.get('parent')
  const isActiveTab = sidebarTabs?.activeTabSlug === tabSlug
  const selectedNodeId = isActiveTab
    ? (parentParam ?? selectedNodeIdFromServer ?? undefined)
    : undefined

  const baseFilterKey = baseFilter ? JSON.stringify(baseFilter) : ''

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
        path: `/collections/${hierarchyCollectionSlug}/hierarchy?parent=${id}`,
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
        baseFilter={baseFilter}
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
            baseFilter={baseFilter}
            collectionSlug={hierarchyCollectionSlug}
            filterByCollections={selectedFilters.length > 0 ? selectedFilters : undefined}
            icon={icon}
            initialData={initialData}
            initialExpandedNodes={initialExpandedNodes}
            key={`${hierarchyCollectionSlug}-${baseFilterKey}`}
            onNodeClick={handleNavigateToParent}
            selectedNodeId={selectedNodeId}
            useAsTitle={useAsTitle}
          />
        )}
      </div>
    </>
  )
}
