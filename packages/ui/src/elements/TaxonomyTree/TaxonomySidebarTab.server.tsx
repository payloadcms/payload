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

  try {
    // Get selected node from URL (?parent=<id>)
    const selectedNodeId = searchParams?.parent ? String(searchParams.parent) : null

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

    // STEP 2: If there's a selected node, ensure its ancestor chain is expanded
    if (selectedNodeId) {
      const collectionConfig = payload.collections[collectionSlug]?.config
      const taxonomyConfig = collectionConfig?.taxonomy
      const parentFieldName =
        taxonomyConfig && typeof taxonomyConfig === 'object'
          ? taxonomyConfig.parentFieldName || 'parent'
          : 'parent'

      // Walk up the parent chain to root
      const ancestorIds: (number | string)[] = []
      let currentNodeId: null | number | string = selectedNodeId

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
    const collectionConfig = payload.collections[collectionSlug]?.config
    const treeLimit =
      collectionConfig?.taxonomy && typeof collectionConfig.taxonomy === 'object'
        ? collectionConfig.taxonomy.treeLimit
        : undefined

    initialData = await getInitialTreeData({
      collectionSlug,
      expandedNodeIds: initialExpandedNodes,
      ...(treeLimit !== undefined && { limit: treeLimit }),
      req: {
        payload,
        user,
      } as any,
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
    />
  )
}
