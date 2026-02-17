'use client'

import React, { createContext, use, useCallback, useState } from 'react'

import type { FolderInitialData } from '../../elements/FolderTree/types.js'
import type { FolderContextValue } from './types.js'

const FolderContext = createContext<FolderContextValue | undefined>(undefined)

export type FolderProviderProps = {
  children: React.ReactNode
  collectionSlug: string
  initialExpandedNodes?: (number | string)[]
  parentFieldName?: string
  selectedFolderId?: null | number | string
  treeData?: FolderInitialData | null
  treeLimit?: number
}

export const FolderProvider: React.FC<FolderProviderProps> = ({
  children,
  collectionSlug,
  initialExpandedNodes,
  parentFieldName = 'parent',
  selectedFolderId = null,
  treeData = null,
  treeLimit = 10,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number | string>>(
    () => new Set(initialExpandedNodes ?? []),
  )

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

  const value: FolderContextValue = {
    collectionSlug,
    expandedNodes,
    parentFieldName,
    selectedFolderId,
    toggleNode,
    treeData,
    treeLimit,
  }

  return <FolderContext value={value}>{children}</FolderContext>
}

export const useFolder = (): FolderContextValue => {
  const context = use(FolderContext)
  if (!context) {
    throw new Error('useFolder must be used within FolderProvider')
  }
  return context
}

export type { FolderContextValue } from './types.js'
