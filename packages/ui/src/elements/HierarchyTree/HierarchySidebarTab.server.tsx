import type { SidebarTabServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { createLocalReq, getInitialTreeData } from 'payload'
import { PREFERENCE_KEYS } from 'payload/shared'
import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports dir for proper client boundary
import { HierarchySidebarTab } from '../../exports/client/index.js'
import { TagIcon } from '../../icons/Tag/index.js'
import { RenderServerComponent } from '../RenderServerComponent/index.js'

export type HierarchySidebarTabServerProps = {
  hierarchyCollectionSlug: string
} & SidebarTabServerProps

export const HierarchySidebarTabServer: React.FC<HierarchySidebarTabServerProps> = async ({
  hierarchyCollectionSlug,
  i18n,
  payload,
  searchParams,
  user,
}) => {
  if (!user) {
    return null
  }

  let initialData = null
  let initialExpandedNodes: (number | string)[] = []
  let initialSelectedFilters: string[] = []
  let selectedNodeId: null | string = null
  let parentFieldName = 'parent'
  let treeLimit: number | undefined
  let typeFieldName: string | undefined
  let useAsTitle: string | undefined
  let collectionSpecificOptions: { label: string; value: string }[] = []

  // Get collection config and render icon (outside try block - doesn't need async)
  const collectionConfig = payload.collections[hierarchyCollectionSlug]?.config
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined

  const IconComponent = hierarchyConfig?.admin?.components?.Icon
  const icon = IconComponent ? (
    RenderServerComponent({
      Component: IconComponent,
      importMap: payload.importMap,
      key: `hierarchy-sidebar-icon-${hierarchyCollectionSlug}`,
    })
  ) : (
    <TagIcon color="muted" />
  )

  try {
    // Get selected node from URL (?parent=<id>)
    selectedNodeId = searchParams?.parent ? String(searchParams.parent) : null

    // STEP 1: Load user's expanded node preferences
    const preferenceKey = `${PREFERENCE_KEYS.HIERARCHY_TREE}-${hierarchyCollectionSlug}`

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

    if (preferences?.value?.selectedFilters) {
      initialSelectedFilters = preferences.value.selectedFilters
    }

    // STEP 2: Get remaining config values
    parentFieldName = hierarchyConfig?.parentFieldName
    treeLimit = hierarchyConfig?.admin?.treeLimit
    typeFieldName =
      hierarchyConfig?.collectionSpecific && typeof hierarchyConfig.collectionSpecific === 'object'
        ? hierarchyConfig.collectionSpecific.fieldName
        : undefined
    useAsTitle = collectionConfig?.admin?.useAsTitle

    // STEP 2.5: Build collection-specific options from related collections
    if (hierarchyConfig.collectionSpecific && hierarchyConfig?.relatedCollections) {
      collectionSpecificOptions = Object.keys(hierarchyConfig.relatedCollections)
        .map((slug) => {
          const relatedConfig = payload.collections[slug]?.config
          const label = relatedConfig?.labels?.plural ?? slug

          return {
            label: getTranslation(label, i18n),
            value: slug,
          }
        })
        .sort((a, b) => a.label.localeCompare(b.label))
    }

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
            collection: hierarchyCollectionSlug,
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
    const req = await createLocalReq({ user }, payload)

    initialData = await getInitialTreeData({
      collectionSlug: hierarchyCollectionSlug,
      expandedNodeIds: initialExpandedNodes,
      ...(initialSelectedFilters.length > 0 && { filterByCollections: initialSelectedFilters }),
      ...(treeLimit !== undefined && { limit: treeLimit }),
      req,
      selectedNodeId,
      selectedNodeParentId,
    })
  } catch (error) {
    payload.logger.warn({
      err: error,
      msg: `Failed to fetch hierarchy data for ${hierarchyCollectionSlug}`,
    })
    // Fall back to client-side fetching if server fetch fails
  }

  return (
    <HierarchySidebarTab
      collectionSpecificOptions={collectionSpecificOptions}
      hierarchyCollectionSlug={hierarchyCollectionSlug}
      icon={icon}
      initialData={initialData}
      initialExpandedNodes={initialExpandedNodes}
      initialSelectedFilters={initialSelectedFilters}
      parentFieldName={parentFieldName}
      selectedNodeId={selectedNodeId}
      treeLimit={treeLimit}
      typeFieldName={typeFieldName}
      useAsTitle={useAsTitle}
    />
  )
}
