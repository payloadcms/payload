'use client'

import type { SidebarTabClientProps } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback } from 'react'

import type { TaxonomyInitialData } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { TaxonomyTree } from './index.js'

export const TaxonomySidebarTab: React.FC<
  {
    collectionSlug: string
    initialData?: null | TaxonomyInitialData
    initialExpandedNodes?: (number | string)[]
  } & SidebarTabClientProps
> = ({ collectionSlug, initialData, initialExpandedNodes }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

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

  return (
    <div className="taxonomy-sidebar-tab">
      <TaxonomyTree
        collectionSlug={collectionSlug}
        initialData={initialData}
        initialExpandedNodes={initialExpandedNodes}
        key={collectionSlug}
        onNodeClick={handleNodeClick}
        selectedNodeId={selectedNodeId}
      />
    </div>
  )
}
