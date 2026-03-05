'use client'

import type { SidebarTabClientProps } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useState } from 'react'

import type { HierarchyInitialData } from './types.js'

import { HierarchySearch } from '../../elements/HierarchySearch/index.js'
import { HydrateHierarchyProvider } from '../../elements/HydrateHierarchyProvider/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { HierarchyTree } from './index.js'

export const HierarchySidebarTab: React.FC<
  {
    collectionSlug: string
    filterOptions?: { label: string; value: string }[]
    initialData?: HierarchyInitialData | null
    initialExpandedNodes?: (number | string)[]
    parentFieldName?: string
    selectedNodeId?: null | string
    treeLimit?: number
    typeFieldName?: string
    useAsTitle?: string
  } & SidebarTabClientProps
> = ({
  collectionSlug,
  filterOptions,
  initialData,
  initialExpandedNodes,
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
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  const selectedNodeId = searchParams.get('parent') ?? selectedNodeIdFromServer ?? undefined

  const handleNavigateToParent = useCallback(
    (id: number | string) => {
      const url = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}?parent=${id}`,
      })
      startRouteTransition(() => {
        router.push(url)
        router.refresh()
      })
    },
    [adminRoute, collectionSlug, router, startRouteTransition],
  )

  return (
    <>
      <HydrateHierarchyProvider
        collectionSlug={collectionSlug}
        expandedNodes={initialExpandedNodes}
        parentFieldName={parentFieldName}
        treeData={initialData}
        treeLimit={treeLimit}
        typeFieldName={typeFieldName}
      />
      <div className="hierarchy-sidebar-tab">
        <HierarchySearch
          collectionSlug={collectionSlug}
          filterOptions={filterOptions}
          isActive={isSearchActive}
          onActiveChange={setIsSearchActive}
          onFilterChange={setSelectedFilters}
          onSelect={handleNavigateToParent}
          selectedFilters={selectedFilters}
        />
        {!isSearchActive && (
          <HierarchyTree
            collectionSlug={collectionSlug}
            filterByCollections={selectedFilters.length > 0 ? selectedFilters : undefined}
            initialData={initialData}
            key={collectionSlug}
            onNodeClick={handleNavigateToParent}
            selectedNodeId={selectedNodeId}
            useAsTitle={useAsTitle}
          />
        )}
      </div>
    </>
  )
}
