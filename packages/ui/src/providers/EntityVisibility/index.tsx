'use client'
import type {
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  VisibleEntities,
} from 'packages/payload/src/exports/types.js'

import React, { createContext, useCallback, useContext, useState } from 'react'

export { SetEntityVisibility } from './SetEntityVisibility.js'

export type VisibleEntitiesContextType = {
  isEntityVisible: ({
    collectionSlug,
    globalSlug,
  }: {
    collectionSlug?: SanitizedCollectionConfig['slug']
    globalSlug?: SanitizedGlobalConfig['slug']
  }) => boolean
  setVisibleEntities: React.Dispatch<React.SetStateAction<VisibleEntities>>
  visibleEntities: VisibleEntities
}

export const EntityVisibilityContext = createContext({} as VisibleEntitiesContextType)

export const EntityVisibilityProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [visibleEntities, setVisibleEntities] = useState<VisibleEntities>({
    collections: [],
    globals: [],
  })

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
    <EntityVisibilityContext.Provider
      value={{ isEntityVisible, setVisibleEntities, visibleEntities }}
    >
      {children}
    </EntityVisibilityContext.Provider>
  )
}

export const useEntityVisibility = (): VisibleEntitiesContextType =>
  useContext(EntityVisibilityContext)
