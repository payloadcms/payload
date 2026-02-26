'use client'
import type { ClientAdminConfig, RscAdminConfig } from 'payload'

import { createContext, use } from 'react'

const ClientAdminConfigContext = createContext<ClientAdminConfig>({})
const RscOverridesContext = createContext<RscAdminConfig>({})

export const ClientAdminConfigProvider: React.FC<{
  readonly children: React.ReactNode
  readonly config: ClientAdminConfig
}> = ({ children, config }) => {
  return <ClientAdminConfigContext value={config}>{children}</ClientAdminConfigContext>
}

export const RscOverridesProvider: React.FC<{
  readonly children: React.ReactNode
  readonly overrides: RscAdminConfig
}> = ({ children, overrides }) => {
  return <RscOverridesContext value={overrides}>{children}</RscOverridesContext>
}

export const useClientAdminConfig = (): ClientAdminConfig => use(ClientAdminConfigContext)
export const useRscOverrides = (): RscAdminConfig => use(RscOverridesContext)

/**
 * @deprecated Use `useClientAdminConfig` instead.
 */
export const useAdminConfig = useClientAdminConfig

/**
 * @deprecated Use `ClientAdminConfigProvider` instead.
 */
export const AdminConfigProvider = ClientAdminConfigProvider
