'use client'
import type { ClientCollectionConfig, ClientConfig, ClientGlobalConfig } from 'payload'

import React, { createContext, useCallback, useContext, useState } from 'react'

export type ClientConfigContext = {
  config: ClientConfig
  getEntityConfig: (args: {
    collectionSlug?: string
    globalSlug?: string
  }) => ClientConfig['collections'][number] | ClientConfig['globals'][number]
  setEntityConfig: (args: {
    collectionSlug?: string
    config: ClientCollectionConfig | ClientGlobalConfig
    globalSlug?: string
  }) => void
}

const Context = createContext<ClientConfigContext | undefined>(undefined)

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

  const setEntityConfig = useCallback<ClientConfigContext['setEntityConfig']>(
    ({ collectionSlug, globalSlug, ...args }) => {
      const newConfig = { ...config }

      if (collectionSlug) {
        const index = config.collections.findIndex(
          (collection) => collection.slug === collectionSlug,
        )
        if (index === -1) {
          newConfig.collections.push(args.config as ClientCollectionConfig)
        } else {
          newConfig.collections[index] = args.config as ClientCollectionConfig
        }
      } else if (globalSlug) {
        const index = config.globals.findIndex((global) => global.slug === globalSlug)
        if (index === -1) {
          newConfig.globals.push(args.config as ClientGlobalConfig)
        } else {
          newConfig.globals[index] = args.config as ClientGlobalConfig
        }
      }

      setConfig(newConfig)
    },
    [config, setConfig],
  )

  return (
    <Context.Provider value={{ config, getEntityConfig, setEntityConfig }}>
      {children}
    </Context.Provider>
  )
}

export const useConfig = (): ClientConfigContext => useContext(Context)
