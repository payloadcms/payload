'use client'
import type { ClientCollectionConfig, CollectionSlug } from 'payload'

import { useConfig, useEntityVisibility } from '@payloadcms/ui'
import * as React from 'react'

type UseEnabledRelationshipsOptions = {
  enabledCollectionSlugs: CollectionSlug[]
}

type UseEnabledRelationshipsResult = {
  enabledCollections: ClientCollectionConfig[]
  enabledCollectionSlugs: CollectionSlug[]
}

export const useEnabledRelationships = ({
  enabledCollectionSlugs,
}: UseEnabledRelationshipsOptions): UseEnabledRelationshipsResult => {
  const {
    config: { collections },
  } = useConfig()
  const { visibleEntities } = useEntityVisibility()

  return React.useMemo(() => {
    const enabledCollections = collections.filter(
      ({ slug }) =>
        enabledCollectionSlugs.includes(slug) &&
        (!visibleEntities?.collections || visibleEntities.collections.includes(slug)),
    )
    return {
      enabledCollections,
      enabledCollectionSlugs: enabledCollections.map((c) => c.slug),
    }
  }, [collections, enabledCollectionSlugs, visibleEntities])
}
