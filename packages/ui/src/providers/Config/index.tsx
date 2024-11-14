'use client'
import type { ClientCollectionConfig, ClientConfig, ClientGlobalConfig } from 'payload'

import React, { createContext, useCallback, useContext, useState } from 'react'

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
