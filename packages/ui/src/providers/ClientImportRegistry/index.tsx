'use client'

import React, { createContext, use, useMemo } from 'react'

import {
  type ClientImportFactory,
  type ClientImportRegistry,
  createClientImportRegistry,
} from '../../utilities/clientImportRegistry.js'

const ClientImportRegistryContext = createContext<ClientImportRegistry | null>(null)

export function ClientImportRegistryProvider({
  children,
  factories,
}: {
  children: React.ReactNode
  factories?: Record<string, ClientImportFactory>
}) {
  const registry = useMemo(() => createClientImportRegistry(factories ?? {}), [factories])
  return <ClientImportRegistryContext value={registry}>{children}</ClientImportRegistryContext>
}

export function useClientImportRegistry(): ClientImportRegistry {
  const ctx = use(ClientImportRegistryContext)
  if (!ctx) {
    throw new Error('useClientImportRegistry must be used within ClientImportRegistryProvider')
  }
  return ctx
}
