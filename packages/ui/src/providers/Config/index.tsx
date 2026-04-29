/* eslint-disable perfectionist/sort-object-types  */ // Need to disable this rule because the order of the overloads is important
'use client'
import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientGlobalConfig,
  CollectionSlug,
  GlobalSlug,
  ImportMap,
} from 'payload'

import React, { createContext, use, useCallback, useEffect, useMemo } from 'react'

import type { ClientImportFactory } from '../../utilities/clientImportRegistry.js'

import { useControllableState } from '../../hooks/useControllableState.js'
import { ClientImportRegistryProvider } from '../ClientImportRegistry/index.js'

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
  /**
   * The client-bundleable runtime `importMap` artifact (the same object exported from
   * `app/(payload)/admin/importMap.client.js`). Each value is a JS reference (component
   * or function) keyed by `${path}#${exportName}`. Because the source module carries a
   * `'use client'` directive, every value is RSC-serializable as a client reference.
   * When provided, the wrapped `ClientImportRegistryProvider` is hydrated with one
   * factory per entry so client code (e.g. condition / admin.validate refs) can resolve
   * modules synchronously after the first render.
   *
   * Do NOT pass the full server-side `importMap.js` export here — it contains references
   * to server-only modules (e.g. `@payloadcms/next/rsc#CollectionCards`) that crash the
   * RSC bundler when serialized into a client component.
   */
  readonly clientImportMap?: ImportMap
  readonly config: ClientConfig
}> = ({ children, clientImportMap, config: configFromProps }) => {
  // Need to update local config state if config from props changes, for HMR.
  // That way, config changes will be updated in the UI immediately without needing a refresh.
  // useControllableState handles this for us.
  const [config, setConfig] = useControllableState<ClientConfig>(configFromProps)

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
      if ('collectionSlug' in args && args.collectionSlug) {
        return collectionsBySlug[args.collectionSlug] ?? null
      }

      if ('globalSlug' in args && args.globalSlug) {
        return globalsBySlug[args.globalSlug] ?? null
      }

      return null as any
    },
    [collectionsBySlug, globalsBySlug],
  )

  const value = useMemo(
    () => ({ config, getEntityConfig, setConfig }),
    [config, getEntityConfig, setConfig],
  )

  // Build a factory map from the client importMap so the inner registry can
  // resolve admin-condition / admin-validate refs synchronously. The factories
  // wrap each pre-resolved value in `Promise.resolve` to satisfy the registry's
  // async contract without a real dynamic import.
  const factories = useMemo(() => {
    if (!clientImportMap) {
      return undefined
    }
    const out: Record<string, ClientImportFactory> = {}
    for (const [key, value] of Object.entries(clientImportMap)) {
      out[key] = () => Promise.resolve({ default: value, [extractExportName(key)]: value })
    }
    return out
  }, [clientImportMap])

  return (
    <RootConfigContext value={value}>
      <ClientImportRegistryProvider factories={factories}>{children}</ClientImportRegistryProvider>
    </RootConfigContext>
  )
}

function extractExportName(key: string): string {
  const idx = key.indexOf('#')
  if (idx === -1) {
    return 'default'
  }
  return key.slice(idx + 1)
}

export const useConfig = (): ClientConfigContext => use(RootConfigContext)

/**
 * This provider shadows the `ConfigProvider` on the _page_ level, allowing us to
 * update the config when needed, e.g. after authentication.
 * The layout `ConfigProvider` is not updated on page navigation / authentication,
 * as the layout does not re-render in those cases.
 *
 * If the config here has the same reference as the config from the layout, we
 * simply reuse the context from the layout to avoid unnecessary re-renders.
 *
 * @experimental This component is experimental and may change or be removed in future releases. Use at your own risk.
 */
export const PageConfigProvider: React.FC<{
  readonly children: React.ReactNode
  readonly config: ClientConfig
}> = ({ children, config: configFromProps }) => {
  const { config: rootConfig, setConfig: setRootConfig } = useConfig()

  /**
   * This `useEffect` is required in order for the _page_ to be able to refresh the client config,
   * which may have been cached on the _layout_ level, where the `ConfigProvider` is managed.
   * Since the layout does not re-render on page navigation / authentication, we need to manually
   * update the config, as the user may have been authenticated in the process, which affects the client config.
   */
  useEffect(() => {
    setRootConfig(configFromProps)
  }, [configFromProps, setRootConfig])

  // If this component receives a different config than what is in context from the layout, it is stale.
  // While stale, we instantiate a new context provider that provides the new config until the root context is updated.
  // Unfortunately, referential equality alone does not work bc the reference is lost during server/client serialization,
  // so we need to also compare the `unauthenticated` property.
  if (
    rootConfig !== configFromProps &&
    rootConfig.unauthenticated !== configFromProps.unauthenticated
  ) {
    return <ConfigProvider config={configFromProps}>{children}</ConfigProvider>
  }

  return children
}
