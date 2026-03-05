'use client'

import type React from 'react'

import { useEffect } from 'react'

import type { HydrateHierarchyProviderProps } from '../../providers/Hierarchy/types.js'

import { useHierarchy } from '../../providers/Hierarchy/index.js'

export const HydrateHierarchyProvider: React.FC<HydrateHierarchyProviderProps> = ({
  allowedCollections,
  collectionSlug,
  expandedNodes,
  parent,
  parentFieldName,
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
      collectionSlug,
      expandedNodes,
      parent,
      parentFieldName,
      tableData,
      treeData,
      treeLimit,
      typeFieldName,
      useAsTitle,
    })
  }, [
    collectionSlug,
    expandedNodes,
    hydrate,
    parent,
    parentFieldName,
    tableData,
    treeData,
    treeLimit,
    typeFieldName,
    useAsTitle,
    allowedCollections,
  ])

  return null
}
