import type { SidebarTabServerProps } from 'payload'

import { getInitialTreeData } from 'payload'
import { PREFERENCE_KEYS } from 'payload/shared'
import React from 'react'

import { TaxonomySidebarTab } from './TaxonomySidebarTab.js'

export type TaxonomySidebarTabServerProps = {
  collectionSlug: string
} & SidebarTabServerProps

export const TaxonomySidebarTabServer: React.FC<TaxonomySidebarTabServerProps> = async ({
  collectionSlug,
  payload,
  searchParams,
  user,
}) => {
  if (!user) {
    return null
  }

  let initialData = null
  let initialExpandedNodes: (number | string)[] = []
  let selectedNodeId: null | string = null
  let parentFieldName = 'parent'
  let treeLimit: number | undefined
  let useAsTitle: string | undefined

  try {
    // Get selected node from URL (?parent=<id>)
    selectedNodeId = searchParams?.parent ? String(searchParams.parent) : null

    // STEP 1: Load user's expanded node preferences
    const preferenceKey = `${PREFERENCE_KEYS.TAXONOMY_TREE}-${collectionSlug}`

    const { docs: preferenceDocs } = await payload.find({
      collection: 'payload-preferences',
      limit: 1,
      overrideAccess: false,
      user,
      where: {
        and: [
          { key: { equals: preferenceKey } },
          { 'user.value': { equals: user.id } },
          { 'user.relationTo': { equals: user.collection } },
        ],
      },
    })

    const preferences = preferenceDocs[0]

    if (preferences?.value?.expandedNodes) {
      initialExpandedNodes = preferences.value.expandedNodes
    }

    // STEP 2: Get collection config
    const collectionConfig = payload.collections[collectionSlug]?.config
    const taxonomyConfig = collectionConfig?.taxonomy
    parentFieldName = taxonomyConfig?.parentFieldName || 'parent'
    treeLimit = taxonomyConfig?.treeLimit
    useAsTitle = collectionConfig?.admin?.useAsTitle

    // Track the immediate parent of the selected node (for ensuring siblings are loaded)
    let selectedNodeParentId: null | number | string = null

    // If there's a selected node, ensure its ancestor chain is expanded
    if (selectedNodeId) {
      // Walk up the parent chain to root
      const ancestorIds: (number | string)[] = []
      let currentNodeId: null | number | string = selectedNodeId
      let isFirstIteration = true

      while (currentNodeId) {
        try {
          const node = await payload.findByID({
            id: currentNodeId,
            collection: collectionSlug,
            depth: 0,
            overrideAccess: false,
            user,
          })

          const parentId = node?.[parentFieldName]

          // Capture the immediate parent of the selected node
          if (isFirstIteration) {
            selectedNodeParentId = parentId ?? null
            isFirstIteration = false
          }

          if (parentId) {
            ancestorIds.push(parentId)
            currentNodeId = parentId
          } else {
            currentNodeId = null
          }
        } catch {
          // Node not found or access denied
          break
        }
      }

      // Merge ancestor IDs with existing expanded nodes
      const expandedSet = new Set(initialExpandedNodes)
      ancestorIds.forEach((id) => expandedSet.add(id))
      initialExpandedNodes = Array.from(expandedSet)
    }

    // STEP 3: Fetch tree data (root nodes + children of expanded nodes + selected node path)
    initialData = await getInitialTreeData({
      collectionSlug,
      expandedNodeIds: initialExpandedNodes,
      ...(treeLimit !== undefined && { limit: treeLimit }),
      req: {
        payload,
        user,
      } as any,
      selectedNodeId,
      selectedNodeParentId,
    })
  } catch (error) {
    payload.logger.warn({
      err: error,
      msg: `Failed to fetch taxonomy data for ${collectionSlug}`,
    })
    // Fall back to client-side fetching if server fetch fails
  }

  return (
    <TaxonomySidebarTab
      collectionSlug={collectionSlug}
      initialData={initialData}
      initialExpandedNodes={initialExpandedNodes}
      parentFieldName={parentFieldName}
      selectedNodeId={selectedNodeId}
      treeLimit={treeLimit}
      useAsTitle={useAsTitle}
    />
  )
}
