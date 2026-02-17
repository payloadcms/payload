'use client'

import type { SidebarTabClientProps } from 'payload'

import { useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useState } from 'react'

import type { FolderInitialData } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { FolderTree } from './index.js'

export const FolderSidebarTab: React.FC<
  {
    collectionSlug: string
    initialData?: FolderInitialData | null
    initialExpandedNodes?: (number | string)[]
    parentFieldName?: string
    selectedFolderId?: null | string
    treeLimit?: number
  } & SidebarTabClientProps
> = ({
  collectionSlug,
  initialData,
  initialExpandedNodes,
  parentFieldName = 'folder',
  selectedFolderId: selectedFolderIdFromServer,
  treeLimit,
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const [expandedNodes, setExpandedNodes] = useState<Set<number | string>>(
    () => new Set(initialExpandedNodes ?? []),
  )

  const selectedFolderId = searchParams.get('folder') ?? undefined

  const toggleNode = useCallback((id: number | string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleNodeClick = useCallback(
    (id: number | string) => {
      const url = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}?folder=${id}`,
      })
      router.push(url)
      router.refresh()
    },
    [adminRoute, collectionSlug, router],
  )

  return (
    <div className="folder-sidebar-tab">
      <FolderTree
        collectionSlug={collectionSlug}
        expandedNodes={expandedNodes}
        initialData={initialData}
        key={collectionSlug}
        onNodeClick={handleNodeClick}
        parentFieldName={parentFieldName}
        selectedNodeId={selectedFolderId}
        toggleNode={toggleNode}
        treeLimit={treeLimit}
      />
    </div>
  )
}
