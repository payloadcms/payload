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

const EntityConfigContext = createContext<EntityConfigContext | undefined>(undefined)

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

export const EntityConfigProvider: React.FC<{
  readonly children: React.ReactNode
  readonly collectionConfig?: ClientCollectionConfig
  readonly globalConfig?: ClientGlobalConfig
}> = ({
  children,
  collectionConfig: collectionConfigFromProps,
  globalConfig: globalConfigFromProps,
}) => {
  const [collectionConfig, setCollectionConfig] = useState<ClientCollectionConfig | undefined>(
    collectionConfigFromProps,
  )

  const [globalConfig, setGlobalConfig] = useState<ClientGlobalConfig | undefined>(
    globalConfigFromProps,
  )

  const setEntityConfigHandler = useCallback(
    (args: {
      collectionConfig?: ClientCollectionConfig | null
      globalConfig?: ClientGlobalConfig | null
    }) => {
      const { collectionConfig, globalConfig } = args

      if (collectionConfig) {
        setCollectionConfig(collectionConfig)
      }

      if (globalConfig) {
        setGlobalConfig(globalConfig)
      }
    },
    [setCollectionConfig, setGlobalConfig],
  )

  return (
    <EntityConfigContext.Provider
      value={{ collectionConfig, globalConfig, setEntityConfig: setEntityConfigHandler }}
    >
      {children}
    </EntityConfigContext.Provider>
  )
}

export const useConfig = (): ClientConfigContext => useContext(RootConfigContext)

export const useEntityConfig = (): EntityConfigContext => {
  const context = useContext(EntityConfigContext)

  if (!context) {
    throw new Error('useEntityConfig must be used within an EntityConfigProvider')
  }

  return context
}
