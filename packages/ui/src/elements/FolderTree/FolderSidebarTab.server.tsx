import type { SidebarTabServerProps } from 'payload'

import { PREFERENCE_KEYS } from 'payload/shared'
import React from 'react'

import type { FolderInitialData } from './types.js'

import { FolderSidebarTab } from './FolderSidebarTab.js'

export type FolderSidebarTabServerProps = {
  /** The folder collection slug (e.g., 'payload-folders') */
  folderCollectionSlug: string
  /** The collection that uses folders (for URL context) */
  targetCollectionSlug: string
} & SidebarTabServerProps

const DEFAULT_FOLDER_TREE_LIMIT = 10

export const FolderSidebarTabServer: React.FC<FolderSidebarTabServerProps> = async ({
  folderCollectionSlug,
  payload,
  searchParams,
  targetCollectionSlug,
  user,
}) => {
  if (!user) {
    return null
  }

  let initialData: FolderInitialData | null = null
  let initialExpandedNodes: (number | string)[] = []
  let selectedFolderId: null | string = null
  let parentFieldName = 'folder'
  const treeLimit: number = DEFAULT_FOLDER_TREE_LIMIT

  try {
    // Get selected folder from URL (?folder=<id>)
    selectedFolderId = searchParams?.folder ? String(searchParams.folder) : null

    // STEP 1: Load user's expanded node preferences
    const preferenceKey = `${PREFERENCE_KEYS.FOLDER_TREE}-${targetCollectionSlug}`

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

    // STEP 2: Get folder collection config
    const folderCollectionConfig = payload.collections[folderCollectionSlug]?.config
    const folderConfig = folderCollectionConfig?.folder

    if (folderConfig) {
      parentFieldName = folderConfig.parentFieldName || 'folder'
    }

    // Track the immediate parent of the selected folder
    let selectedFolderParentId: null | number | string = null

    // STEP 3: If there's a selected folder, ensure its ancestor chain is expanded
    if (selectedFolderId) {
      const ancestorIds: (number | string)[] = []
      let currentNodeId: null | number | string = selectedFolderId
      let isFirstIteration = true

      while (currentNodeId) {
        try {
          const node = await payload.findByID({
            id: currentNodeId,
            collection: folderCollectionSlug,
            depth: 0,
            overrideAccess: false,
            user,
          })

          const parentId = node?.[parentFieldName]

          // Capture the immediate parent of the selected folder
          if (isFirstIteration) {
            selectedFolderParentId = parentId ?? null
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
      expandedNodeIds: initialExpandedNodes,
      folderCollectionSlug,
      limit: treeLimit,
      parentFieldName,
      payload,
      selectedFolderId,
      selectedFolderParentId,
      user,
    })
  } catch (error) {
    payload.logger.warn({
      err: error,
      msg: `Failed to fetch folder tree data for ${folderCollectionSlug}`,
    })
    // Fall back to client-side fetching if server fetch fails
  }

  return (
    <FolderSidebarTab
      collectionSlug={folderCollectionSlug}
      initialData={initialData}
      initialExpandedNodes={initialExpandedNodes}
      parentFieldName={parentFieldName}
      selectedFolderId={selectedFolderId}
      treeLimit={treeLimit}
    />
  )
}

type GetInitialFolderTreeDataArgs = {
  expandedNodeIds: (number | string)[]
  folderCollectionSlug: string
  limit: number
  parentFieldName: string
  payload: SidebarTabServerProps['payload']
  selectedFolderId: null | string
  selectedFolderParentId: null | number | string
  user: SidebarTabServerProps['user']
}

async function getInitialFolderTreeData({
  expandedNodeIds,
  folderCollectionSlug,
  limit,
  parentFieldName,
  payload,
  selectedFolderId,
  selectedFolderParentId,
  user,
}: GetInitialFolderTreeDataArgs): Promise<FolderInitialData> {
  const allDocs: FolderInitialData['docs'] = []
  const loadedParents: FolderInitialData['loadedParents'] = {}

  // Normalize selectedFolderParentId
  const normalizedSelectedParentId =
    selectedFolderParentId === null || selectedFolderParentId === undefined
      ? 'null'
      : String(selectedFolderParentId)

  // Helper to check if selectedFolderId is among siblings at a given parent level
  const needsSelectedNodeIncluded = (parentKey: string): boolean => {
    return !!selectedFolderId && normalizedSelectedParentId === parentKey
  }

  // Helper to fetch children with optional selectedFolderId inclusion
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
        collection: folderCollectionSlug,
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

      // Check if selectedFolderId is in this page's results
      if (mustIncludeSelected && !foundSelected) {
        foundSelected = result.docs.some((doc) => String(doc.id) === String(selectedFolderId))
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
