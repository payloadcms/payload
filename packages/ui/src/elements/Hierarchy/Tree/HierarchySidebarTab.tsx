'use client'

import type { SidebarTabClientProps } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { HierarchyInitialData } from './types.js'

import { useConfig } from '../../../providers/Config/index.js'
import { useHierarchy } from '../../../providers/Hierarchy/index.js'
import { usePathname, useRouter, useSearchParams } from '../../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../../providers/RouteTransition/index.js'
import { useSidebarTabs } from '../../../providers/SidebarTabs/index.js'
import { getFolderHierarchySlug } from '../getFolderHierarchySlug.js'
import { HydrateHierarchyProvider } from '../HydrateProvider/index.js'
import { HierarchySearch } from '../Search/index.js'
import { HierarchyTree } from './index.js'

export const HierarchySidebarTab: React.FC<
  {
    baseFilter?: Record<string, unknown>
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
  hierarchyCollectionSlug,
  icon: _icon,
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { startRouteTransition } = useRouteTransition()
  const {
    config,
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const [isSearchActive, setIsSearchActive] = useState(false)
  const { treeRefreshKeys } = useHierarchy()
  const sidebarTabs = useSidebarTabs()

  const resolvedParentFieldName = parentFieldName ?? 'parent'
  const currentParentParam = searchParams.get(resolvedParentFieldName)

  // When refreshTree(slug) is called from the list view (e.g. after mutations), reload this tab.
  // Always reload regardless of active state so inactive tabs are fresh when switched to.
  // The render-tab server function runs with a fresh request that lacks the client's URL query,
  // so forward the current selected parent id — otherwise the reload can't tell which node is
  // being viewed and rebuilds the tree from preference state.
  const tabSlug = `hierarchy-${hierarchyCollectionSlug}`
  const isActiveTab = sidebarTabs?.activeTabSlug === tabSlug
  const treeRefreshKey = treeRefreshKeys.get(hierarchyCollectionSlug) ?? 0
  const prevTreeRefreshKeyRef = useRef(treeRefreshKey)
  useEffect(() => {
    if (prevTreeRefreshKeyRef.current !== treeRefreshKey) {
      prevTreeRefreshKeyRef.current = treeRefreshKey
      // Only forward the selected parent id when this tab is active. currentParentParam
      // reflects the global URL search params, so an inactive tab could otherwise pick up
      // another hierarchy collection's value if they share the same parentFieldName.
      sidebarTabs?.reloadTabContent(tabSlug, {
        searchParams:
          isActiveTab && currentParentParam
            ? { [resolvedParentFieldName]: currentParentParam }
            : undefined,
      })
    }
  }, [
    treeRefreshKey,
    sidebarTabs,
    tabSlug,
    isActiveTab,
    currentParentParam,
    resolvedParentFieldName,
  ])

  // Only highlight selected node when this tab is active
  const selectedNodeId = isActiveTab
    ? (currentParentParam ?? selectedNodeIdFromServer ?? undefined)
    : undefined

  const baseFilterKey = baseFilter ? JSON.stringify(baseFilter) : ''

  /**
   * When the user is already browsing a collection by folder, clicking a folder in the tree keeps
   * them in that collection rather than switching to the folder collection's own view.
   */
  const browsedCollectionSlug = useMemo(() => {
    const routeSlug = pathname?.match(/\/collections\/([^/]+)\/hierarchy/)?.[1]

    if (!routeSlug || routeSlug === hierarchyCollectionSlug) {
      return hierarchyCollectionSlug
    }

    // Only follow the route when it really is scoped to this tree - another hierarchy's tab must
    // not start linking into an unrelated collection.
    return getFolderHierarchySlug(config.collections, routeSlug) === hierarchyCollectionSlug
      ? routeSlug
      : hierarchyCollectionSlug
  }, [config.collections, hierarchyCollectionSlug, pathname])

  const handleNavigateToParent = useCallback(
    ({ id }: { id: number | string }) => {
      const url = formatAdminURL({
        adminRoute,
        path: `/collections/${browsedCollectionSlug}/hierarchy?${resolvedParentFieldName}=${id}`,
      })
      startRouteTransition(() => {
        router.push(url)
        router.refresh()
      })
    },
    [adminRoute, browsedCollectionSlug, resolvedParentFieldName, router, startRouteTransition],
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
          isActive={isSearchActive}
          onActiveChange={setIsSearchActive}
          onSelect={handleNavigateToParent}
          parentId={selectedNodeId ?? null}
        />
        {!isSearchActive && (
          <HierarchyTree
            baseFilter={baseFilter}
            collectionSlug={hierarchyCollectionSlug}
            filterByCollections={
              initialSelectedFilters?.length ? initialSelectedFilters : undefined
            }
            icon={_icon}
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
