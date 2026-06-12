'use client'

import type React from 'react'

import { useEffect } from 'react'

import type { HydrateHierarchyProviderProps } from '../../../providers/Hierarchy/types.js'

import { useHierarchy } from '../../../providers/Hierarchy/index.js'

export const HydrateHierarchyProvider: React.FC<HydrateHierarchyProviderProps> = ({
  allowedCollections,
  baseFilter,
  collectionSlug,
  expandedNodes,
  parent,
  parentFieldName,
  selectedFilters,
  tableData,
  treeData,
  treeLimit,
  typeFieldName,
  useAsTitle,
}) => {
  const { hydrate } = useHierarchy()

  useEffect(() => {
    hydrate({
      allowedCollections,
      baseFilter,
      collectionSlug,
      expandedNodes,
      parent,
      parentFieldName,
      selectedFilters,
      tableData,
      treeData,
      treeLimit,
      typeFieldName,
      useAsTitle,
    })
  }, [
    allowedCollections,
    baseFilter,
    collectionSlug,
    expandedNodes,
    hydrate,
    parent,
    parentFieldName,
    selectedFilters,
    tableData,
    treeData,
    treeLimit,
    typeFieldName,
    useAsTitle,
  ])

  return null
}
