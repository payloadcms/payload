'use client'

import { DEFAULT_HIERARCHY_TREE_LIMIT } from 'payload/shared'
import React, { useCallback, useMemo } from 'react'

import type { HierarchyTreeProps } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useHierarchy } from '../../providers/Hierarchy/index.js'
import { Tree } from '../Tree/index.js'

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  collectionSlug,
  filterByCollections,
  icon,
  initialData,
  onNodeClick,
  selectedNodeId,
  useAsTitle: useAsTitleProp,
}) => {
  const { getExpandedNodesForCollection, toggleNodeForCollection, typeFieldName } = useHierarchy()
  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const hierarchyConfig =
    collectionConfig.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const parentFieldName = hierarchyConfig?.parentFieldName
  const treeLimit = hierarchyConfig?.admin?.treeLimit ?? DEFAULT_HIERARCHY_TREE_LIMIT
  const useAsTitle = useAsTitleProp ?? collectionConfig.admin?.useAsTitle

  // Get all possible type values from relatedCollections for filtering empty arrays
  const allPossibleTypeValues = useMemo(
    () =>
      hierarchyConfig?.relatedCollections
        ? Object.keys(hierarchyConfig.relatedCollections)
        : undefined,
    [hierarchyConfig?.relatedCollections],
  )

  // Get expanded nodes for THIS collection specifically
  const expandedNodes = useMemo(
    () => getExpandedNodesForCollection(collectionSlug),
    [collectionSlug, getExpandedNodesForCollection],
  )

  // Toggle node for THIS collection specifically
  const handleToggleNode = useCallback(
    (id: number | string) => {
      toggleNodeForCollection(collectionSlug, id)
    },
    [collectionSlug, toggleNodeForCollection],
  )

  return (
    <Tree
      allPossibleTypeValues={allPossibleTypeValues}
      collectionSlug={collectionSlug}
      expandedNodes={expandedNodes}
      filterByCollections={filterByCollections}
      icon={icon}
      initialData={initialData}
      onNodeClick={onNodeClick}
      parentFieldName={parentFieldName}
      selectedNodeId={selectedNodeId}
      toggleNode={handleToggleNode}
      treeLimit={treeLimit}
      typeFieldName={typeFieldName}
      useAsTitle={useAsTitle}
    />
  )
}
