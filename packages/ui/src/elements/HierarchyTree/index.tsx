'use client'

import { DEFAULT_HIERARCHY_TREE_LIMIT, HIERARCHY_PARENT_FIELD } from 'payload'
import React from 'react'

import type { HierarchyTreeProps } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useHierarchy } from '../../providers/Hierarchy/index.js'
import { Tree } from '../Tree/index.js'

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  collectionSlug,
  initialData,
  onNodeClick,
  selectedNodeId,
  useAsTitle: useAsTitleProp,
}) => {
  const { expandedNodes, toggleNode } = useHierarchy()
  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const hierarchyConfig =
    collectionConfig.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined
  const parentFieldName = hierarchyConfig?.parentFieldName ?? HIERARCHY_PARENT_FIELD
  const treeLimit = hierarchyConfig?.admin?.treeLimit ?? DEFAULT_HIERARCHY_TREE_LIMIT
  const useAsTitle = useAsTitleProp ?? collectionConfig.admin?.useAsTitle

  return (
    <Tree
      collectionSlug={collectionSlug}
      expandedNodes={expandedNodes}
      initialData={initialData}
      onNodeClick={onNodeClick}
      parentFieldName={parentFieldName}
      selectedNodeId={selectedNodeId ?? undefined}
      toggleNode={toggleNode}
      treeLimit={treeLimit}
      useAsTitle={useAsTitle}
    />
  )
}
