import type { SidebarTabServerProps } from 'payload'

import { PREFERENCE_KEYS } from 'payload/shared'
import React from 'react'

import type { FolderInitialData } from './types.js'

import { FolderSidebarTab } from './index.js'

export type FolderSidebarTabServerProps = {
  /** The folder collection slug */
  collectionSlug: string
} & SidebarTabServerProps

const DEFAULT_FOLDER_TREE_LIMIT = 10

export const FolderSidebarTabServer: React.FC<FolderSidebarTabServerProps> = async ({
  collectionSlug,
  payload,
  searchParams,
  user,
}) => {
  if (!user) {
    return null
  }

  let initialData: FolderInitialData | null = null
  let initialExpandedNodes: (number | string)[] = []
  let selectedNodeId: null | string = null
  let parentFieldName = 'parent'
  let treeLimit: number | undefined = DEFAULT_FOLDER_TREE_LIMIT
  let useAsTitle: string | undefined

  try {
    // Get selected node from URL (?parent=<id>)
    selectedNodeId = searchParams?.parent ? String(searchParams.parent) : null

    // STEP 1: Load user's expanded node preferences
    const preferenceKey = `${PREFERENCE_KEYS.FOLDER_TREE}-${collectionSlug}`

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

    // STEP 2: Get folder collection config (taxonomy config has hierarchy settings)
    const collectionConfig = payload.collections[collectionSlug]?.config
    const taxonomyConfig = collectionConfig?.taxonomy

    if (taxonomyConfig && typeof taxonomyConfig === 'object') {
      parentFieldName = taxonomyConfig.parentFieldName || 'parent'
      treeLimit = taxonomyConfig.treeLimit ?? DEFAULT_FOLDER_TREE_LIMIT
    }

    // Get useAsTitle from collection admin config
    useAsTitle = collectionConfig?.admin?.useAsTitle

    // Track the immediate parent of the selected node
    let selectedNodeParentId: null | number | string = null

    // STEP 3: If there's a selected node, ensure its ancestor chain is expanded
    if (selectedNodeId) {
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

    // STEP 4: Fetch tree data (root nodes + children of expanded nodes)
    initialData = await getInitialFolderTreeData({
      collectionSlug,
      expandedNodeIds: initialExpandedNodes,
      limit: treeLimit,
      parentFieldName,
      payload,
      selectedNodeId,
      selectedNodeParentId,
      user,
    })
  } catch (error) {
    payload.logger.warn({
      err: error,
      msg: `Failed to fetch folder tree data for ${collectionSlug}`,
    })
    // Fall back to client-side fetching if server fetch fails
  }

  return (
    <FolderSidebarTab
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

type GetInitialFolderTreeDataArgs = {
  collectionSlug: string
  expandedNodeIds: (number | string)[]
  limit: number
  parentFieldName: string
  payload: SidebarTabServerProps['payload']
  selectedNodeId: null | string
  selectedNodeParentId: null | number | string
  user: SidebarTabServerProps['user']
}

async function getInitialFolderTreeData({
  collectionSlug,
  expandedNodeIds,
  limit,
  parentFieldName,
  payload,
  selectedNodeId,
  selectedNodeParentId,
  user,
}: GetInitialFolderTreeDataArgs): Promise<FolderInitialData> {
  const allDocs: FolderInitialData['docs'] = []
  const loadedParents: FolderInitialData['loadedParents'] = {}

  // Normalize selectedNodeParentId
  const normalizedSelectedParentId =
    selectedNodeParentId === null || selectedNodeParentId === undefined
      ? 'null'
      : String(selectedNodeParentId)

  // Helper to check if selectedNodeId is among siblings at a given parent level
  const needsSelectedNodeIncluded = (parentKey: string): boolean => {
    return !!selectedNodeId && normalizedSelectedParentId === parentKey
  }

  // Helper to fetch children with optional selectedNodeId inclusion
  const fetchChildrenForParent = async (
    parentKey: string,
    whereClause: Record<string, unknown>,
  ): Promise<void> => {
    const mustIncludeSelected = needsSelectedNodeIncluded(parentKey)
    let accumulatedDocs: FolderInitialData['docs'] = []
    let currentPage = 1
    let hasMore = true
    let totalDocs = 0
    let foundSelected = false

    while (hasMore) {
      const result = await payload.find({
        collection: collectionSlug,
        depth: 0,
        limit,
        overrideAccess: false,
        page: currentPage,
        user,
        where: whereClause,
      })

      accumulatedDocs = [...accumulatedDocs, ...result.docs]
      totalDocs = result.totalDocs
      hasMore = result.hasNextPage

      // Check if selectedNodeId is in this page's results
      if (mustIncludeSelected && !foundSelected) {
        foundSelected = result.docs.some((doc) => String(doc.id) === String(selectedNodeId))
      }

      // Stop if we've found the selected node OR we only need first page
      if (!mustIncludeSelected || foundSelected || !hasMore) {
        break
      }

      currentPage++
    }

    allDocs.push(...accumulatedDocs)
    loadedParents[parentKey] = {
      hasMore,
      loadedCount: accumulatedDocs.length,
      totalDocs,
    }
  }

  // Query 1: Fetch root nodes (folders with no parent)
  await fetchChildrenForParent('null', {
    [parentFieldName]: { exists: false },
  })

  // Query 2: For each expanded node, fetch its children
  for (const parentId of expandedNodeIds) {
    await fetchChildrenForParent(String(parentId), {
      [parentFieldName]: { equals: parentId },
    })
  }

  return {
    docs: allDocs,
    loadedParents,
  }
}
