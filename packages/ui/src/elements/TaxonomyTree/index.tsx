'use client'

import { DEFAULT_TAXONOMY_TREE_LIMIT } from 'payload'
import React from 'react'

import type { TaxonomyTreeProps } from './types.js'

import { useConfig } from '../../providers/Config/index.js'
import { useTaxonomy } from '../../providers/Taxonomy/index.js'
import { Tree } from '../Tree/index.js'

export const TaxonomyTree: React.FC<TaxonomyTreeProps> = ({
  collectionSlug,
  initialData,
  onNodeClick,
  selectedNodeId,
  useAsTitle: useAsTitleProp,
}) => {
  const { expandedNodes, toggleNode } = useTaxonomy()
  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug })
  const parentFieldName = collectionConfig.taxonomy?.parentFieldName || 'parent'
  const treeLimit = collectionConfig.taxonomy?.treeLimit ?? DEFAULT_TAXONOMY_TREE_LIMIT
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
