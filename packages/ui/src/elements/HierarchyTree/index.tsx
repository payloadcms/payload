'use client'

import { DEFAULT_HIERARCHY_TREE_LIMIT } from 'payload'
import React from 'react'

import type { HierarchyTreeProps } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useTaxonomy } from '../../providers/Taxonomy/index.js'
import { Tree } from '../Tree/index.js'

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  collectionSlug,
  initialData,
  onNodeClick,
  selectedNodeId,
  useAsTitle: useAsTitleProp,
}) => {
  const { expandedNodes, toggleNode } = useTaxonomy()
  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const parentFieldName = collectionConfig.hierarchy?.parentFieldName || 'parent'
  const treeLimit = collectionConfig.hierarchy?.admin?.treeLimit ?? DEFAULT_HIERARCHY_TREE_LIMIT
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
