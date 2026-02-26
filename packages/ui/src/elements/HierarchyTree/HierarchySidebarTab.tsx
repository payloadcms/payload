'use client'

import type { SidebarTabClientProps } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useState } from 'react'

import type { HierarchyInitialData } from './types.js'

import { HierarchySearch } from '../../elements/HierarchySearch/index.js'
import { HydrateHierarchyProvider } from '../../elements/HydrateHierarchyProvider/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { HierarchyTree } from './index.js'

export const HierarchySidebarTab: React.FC<
  {
    collectionSlug: string
    initialData?: HierarchyInitialData | null
    initialExpandedNodes?: (number | string)[]
    parentFieldName?: string
    selectedNodeId?: null | string
    treeLimit?: number
    useAsTitle?: string
  } & SidebarTabClientProps
> = ({
  collectionSlug,
  initialData,
  initialExpandedNodes,
  parentFieldName,
  selectedNodeId: selectedNodeIdFromServer,
  treeLimit,
  useAsTitle,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const [isSearchActive, setIsSearchActive] = useState(false)

  const selectedNodeId = searchParams.get('parent') ?? undefined

  const handleNodeClick = useCallback(
    (id: number | string) => {
      const url = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}?parent=${id}`,
      })
      router.push(url)
      router.refresh()
    },
    [adminRoute, collectionSlug, router],
  )

  const handleSearchSelect = useCallback(
    (id: number | string) => {
      const url = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}?parent=${id}`,
      })
      router.push(url)
      router.refresh()
    },
    [adminRoute, collectionSlug, router],
  )

  return (
    <>
      <HydrateHierarchyProvider
        collectionSlug={collectionSlug}
        expandedNodes={initialExpandedNodes}
        parentFieldName={parentFieldName}
        selectedParentId={selectedNodeIdFromServer}
        treeData={initialData}
        treeLimit={treeLimit}
      />
      <div className="hierarchy-sidebar-tab">
        <HierarchySearch
          collectionSlug={collectionSlug}
          isActive={isSearchActive}
          onActiveChange={setIsSearchActive}
          onSelect={handleSearchSelect}
        />
        {!isSearchActive && (
          <HierarchyTree
            collectionSlug={collectionSlug}
            initialData={initialData}
            key={collectionSlug}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
            useAsTitle={useAsTitle}
          />
        )}
      </div>
    </>
  )
}
