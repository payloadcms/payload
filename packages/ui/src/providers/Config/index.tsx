/* eslint-disable perfectionist/sort-object-types  */ // Need to disable this rule because the order of the overloads is important
'use client'
import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientGlobalConfig,
  CollectionSlug,
  GlobalSlug,
} from 'payload'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type GetEntityConfigFn = {
  // Overload #1: collectionSlug only
  // @todo remove "{} |" in 4.0, which would be a breaking change
  (args: { collectionSlug: {} | CollectionSlug; globalSlug?: never }): ClientCollectionConfig

  // Overload #2: globalSlug only
  // @todo remove "{} |" in 4.0, which would be a breaking change
  (args: { collectionSlug?: never; globalSlug: {} | GlobalSlug }): ClientGlobalConfig

  // Overload #3: both/none (fall back to union | null)
  (args: {
    collectionSlug?: {} | CollectionSlug
    globalSlug?: {} | GlobalSlug
  }): ClientCollectionConfig | ClientGlobalConfig | null
}

export type ClientConfigContext = {
  config: ClientConfig
  /**
   * Get a collection or global config by its slug. This is preferred over
   * using `config.collections.find` or `config.globals.find`, because
   * getEntityConfig uses a lookup map for O(1) lookups.
   */
  getEntityConfig: GetEntityConfigFn
  setConfig: (config: ClientConfig) => void
}

const RootConfigContext = createContext<ClientConfigContext | undefined>(undefined)

export const ConfigProvider: React.FC<{
  readonly children: React.ReactNode
  readonly config: ClientConfig
}> = ({ children, config: configFromProps }) => {
  const [config, setConfig] = useState<ClientConfig>(configFromProps)

  // Need to update local config state if config from props changes, for HMR.
  // That way, config changes will be updated in the UI immediately without needing a refresh.
  useEffect(() => {
    setConfig(configFromProps)
  }, [configFromProps])

  // Build lookup maps for collections and globals so we can do O(1) lookups by slug
  const { collectionsBySlug, globalsBySlug } = useMemo(() => {
    const collectionsBySlug: Record<string, ClientCollectionConfig> = {}
    const globalsBySlug: Record<string, ClientGlobalConfig> = {}

    for (const collection of config.collections) {
      collectionsBySlug[collection.slug] = collection
    }
    for (const global of config.globals) {
      globalsBySlug[global.slug] = global
    }

    return { collectionsBySlug, globalsBySlug }
  }, [config])

  const getEntityConfig = useCallback<GetEntityConfigFn>(
    (args) => {
      if ('collectionSlug' in args) {
        return collectionsBySlug[args.collectionSlug] ?? null
      }
      if ('globalSlug' in args) {
        return globalsBySlug[args.globalSlug] ?? null
      }
      return null as any
    },
    [collectionsBySlug, globalsBySlug],
  )

  return (
    <RootConfigContext.Provider value={{ config, getEntityConfig, setConfig }}>
      {children}
    </RootConfigContext.Provider>
  )
}

export const useConfig = (): ClientConfigContext => useContext(RootConfigContext)
