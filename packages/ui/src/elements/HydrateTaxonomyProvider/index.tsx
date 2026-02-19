'use client'

import { useEffect } from 'react'

import type { HydrateTaxonomyProviderProps } from '../../providers/Taxonomy/types.js'

import { useTaxonomy } from '../../providers/Taxonomy/index.js'

export const HydrateTaxonomyProvider: React.FC<HydrateTaxonomyProviderProps> = ({
  collectionSlug,
  expandedNodes,
  parentFieldName,
  selectedParentId,
  tableData,
  treeData,
  treeLimit,
}) => {
  const { hydrate } = useTaxonomy()

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
