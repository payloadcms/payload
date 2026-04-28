'use client'

// The registry is scoped to a single provider mount; remounting (e.g. via
// PageConfigProvider's nested ConfigProvider on certain admin paths) starts
// with a fresh resolution cache.
import React, { createContext, use, useState } from 'react'

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
  // `factories` is treated as initial input only; the registry instance is created once
  // per provider mount so its memoization cache survives parent re-renders.
  const [registry] = useState(() => createClientImportRegistry(factories ?? {}))
  return <ClientImportRegistryContext value={registry}>{children}</ClientImportRegistryContext>
}

export function useClientImportRegistry(): ClientImportRegistry {
  const ctx = use(ClientImportRegistryContext)
  if (!ctx) {
    throw new Error('useClientImportRegistry must be used within ClientImportRegistryProvider')
  }
  return ctx
}
