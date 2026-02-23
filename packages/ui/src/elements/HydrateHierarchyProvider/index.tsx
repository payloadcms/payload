'use client'

import type React from 'react'

import { useEffect } from 'react'

import type { HydrateHierarchyProviderProps } from '../../providers/Hierarchy/types.js'

import { useHierarchy } from '../../providers/Hierarchy/index.js'

export const HydrateHierarchyProvider: React.FC<HydrateHierarchyProviderProps> = ({
  collectionSlug,
  expandedNodes,
  parentFieldName,
  selectedParentId,
  tableData,
  treeData,
  treeLimit,
}) => {
  const { hydrate } = useHierarchy()

  useEffect(() => {
    hydrate({
      collectionSlug,
      expandedNodes,
      parentFieldName,
      selectedParentId,
      tableData,
      treeData,
      treeLimit,
    })
  }, [
    collectionSlug,
    expandedNodes,
    hydrate,
    parentFieldName,
    selectedParentId,
    tableData,
    treeData,
    treeLimit,
  ])

  return null
}
