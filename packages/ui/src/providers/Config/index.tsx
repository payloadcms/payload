'use client'
import type { ClientCollectionConfig, ClientConfig, ClientGlobalConfig } from 'payload'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type ClientConfigContext = {
  config: ClientConfig
  getEntityConfig: (args: {
    collectionSlug?: string
    globalSlug?: string
  }) => ClientCollectionConfig | ClientGlobalConfig | null
  setConfig: (config: ClientConfig) => void
}

export type EntityConfigContext = {
  collectionConfig?: ClientCollectionConfig
  globalConfig?: ClientGlobalConfig
  setEntityConfig: (args: {
    collectionConfig?: ClientCollectionConfig | null
    globalConfig?: ClientGlobalConfig | null
  }) => void
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

  const getEntityConfig = useCallback(
    ({ collectionSlug, globalSlug }: { collectionSlug?: string; globalSlug?: string }) => {
      if (collectionSlug) {
        return config.collections.find((collection) => collection.slug === collectionSlug)
      }

      if (globalSlug) {
        return config.globals.find((global) => global.slug === globalSlug)
      }

      return null
    },
    [config],
  )

  return (
    <RootConfigContext.Provider value={{ config, getEntityConfig, setConfig }}>
      {children}
    </RootConfigContext.Provider>
  )
}

export const useConfig = (): ClientConfigContext => useContext(RootConfigContext)
