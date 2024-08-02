'use client'
import type { ClientConfig } from 'payload'

import React, { createContext, useCallback, useContext } from 'react'

export type ClientConfigContext = {
  config: ClientConfig
  getEntityConfig: (args: {
    collectionSlug?: string
    globalSlug?: string
  }) => ClientConfig['collections'][number] | ClientConfig['globals'][number]
}

const Context = createContext<ClientConfigContext | undefined>(undefined)

export const ConfigProvider: React.FC<{ children: React.ReactNode; config: ClientConfig }> = ({
  children,
  config,
}) => {
  const getEntityConfig = useCallback(
    ({ collectionSlug, globalSlug }: { collectionSlug?: string; globalSlug?: string }) => {
      if (collectionSlug) {
        return config.collections[collectionSlug]
      }

      if (globalSlug) {
        return config.globals[globalSlug]
      }

      return config
    },
    [config],
  )

  return <Context.Provider value={{ config, getEntityConfig }}>{children}</Context.Provider>
}

export const useConfig = (): ClientConfigContext => useContext(Context)
