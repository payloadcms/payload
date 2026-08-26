'use client'
import type { ClientCollectionConfig, CollectionSlug } from 'payload'

import { useConfig, useEntityVisibility } from '@payloadcms/ui'
import * as React from 'react'

import { filterEnabledRelationshipCollections } from '../../shared/filterEnabledRelationshipCollections.js'

type UseEnabledRelationshipsOptions = {
  collectionSlugsBlacklist?: string[]
  collectionSlugsWhitelist?: string[]
  uploads?: boolean
}

type UseEnabledRelationshipsResult = {
  enabledCollections: ClientCollectionConfig[]
  enabledCollectionSlugs: CollectionSlug[]
}

export const useEnabledRelationships = (
  options?: UseEnabledRelationshipsOptions,
): UseEnabledRelationshipsResult => {
  const { collectionSlugsBlacklist, collectionSlugsWhitelist, uploads = false } = options || {}
  const {
    config: { collections },
  } = useConfig()
  const { visibleEntities } = useEntityVisibility()

  return React.useMemo(() => {
    const enabledCollections = filterEnabledRelationshipCollections(collections, {
      disabledCollections: collectionSlugsBlacklist,
      enabledCollections: collectionSlugsWhitelist,
      uploads,
      visibleSlugs: visibleEntities?.collections,
    })
    return {
      enabledCollections,
      enabledCollectionSlugs: enabledCollections.map((c) => c.slug),
    }
  }, [collections, visibleEntities, uploads, collectionSlugsWhitelist, collectionSlugsBlacklist])
}
