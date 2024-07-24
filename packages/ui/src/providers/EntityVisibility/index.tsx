'use client'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig, VisibleEntities } from 'payload'

import React, { createContext, useCallback, useContext } from 'react'

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
    <EntityVisibilityContext.Provider value={{ isEntityVisible, visibleEntities }}>
      {children}
    </EntityVisibilityContext.Provider>
  )
}

export const useEntityVisibility = (): VisibleEntitiesContextType =>
  useContext(EntityVisibilityContext)
