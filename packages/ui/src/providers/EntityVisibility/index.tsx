'use client'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig, VisibleEntities } from 'payload'

import React, { createContext, use, useCallback } from 'react'

export type VisibleEntitiesContextType = {
  isEntityVisible: ({
    collectionSlug,
    globalSlug,
  }: {
    collectionSlug?: SanitizedCollectionConfig['slug']
    globalSlug?: SanitizedGlobalConfig['slug']
  }) => boolean
  visibleEntities: VisibleEntities
}

export const EntityVisibilityContext = createContext({} as VisibleEntitiesContextType)

export const EntityVisibilityProvider: React.FC<{
  children: React.ReactNode
  visibleEntities?: VisibleEntities
}> = ({ children, visibleEntities }) => {
  const isEntityVisible = useCallback(
    ({
      collectionSlug,
      globalSlug,
    }: {
      collectionSlug: SanitizedCollectionConfig['slug']
      globalSlug: SanitizedGlobalConfig['slug']
    }) => {
      if (collectionSlug) {
        return visibleEntities.collections.includes(collectionSlug)
      }

      if (globalSlug) {
        return visibleEntities.globals.includes(globalSlug)
      }

      return false
    },
    [visibleEntities],
  )

  return (
    <EntityVisibilityContext value={{ isEntityVisible, visibleEntities }}>
      {children}
    </EntityVisibilityContext>
  )
}

export const useEntityVisibility = (): VisibleEntitiesContextType => use(EntityVisibilityContext)
