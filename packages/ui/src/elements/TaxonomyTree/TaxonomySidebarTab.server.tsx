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
  user,
}) => {
  if (!user) {
    return null
  }

  let initialData = null
  let initialExpandedNodes: (number | string)[] = []

  try {
    // STEP 1: Load user's expanded node preferences FIRST
    const preferenceKey = `${PREFERENCE_KEYS.TAXONOMY_TREE}-${collectionSlug}`

    const { docs: preferenceDocs } = await payload.find({
      collection: 'payload-preferences',
      limit: 1,
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

    // STEP 2: Fetch tree data using expanded IDs (root nodes + children of expanded nodes)
    initialData = await getInitialTreeData({
      collectionSlug,
      expandedNodeIds: initialExpandedNodes,
      limit: 100,
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
