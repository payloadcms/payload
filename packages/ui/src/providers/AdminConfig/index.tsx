'use client'
import type { ClientAdminConfig, RscAdminConfig } from 'payload'

import { createContext, use } from 'react'

const ClientAdminConfigContext = createContext<ClientAdminConfig>({})
const RscAdminConfigContext = createContext<RscAdminConfig>({})

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
  return <RscAdminConfigContext value={overrides}>{children}</RscAdminConfigContext>
}

export const useClientAdminConfig = (): ClientAdminConfig => use(ClientAdminConfigContext)
export const useRscAdminConfig = (): RscAdminConfig => use(RscAdminConfigContext)

/** @deprecated Use `useClientAdminConfig` instead. */
export const useAdminConfig = useClientAdminConfig
/** @deprecated Use `useRscAdminConfig` instead. */
export const useRscOverrides = useRscAdminConfig
/** @deprecated Use `ClientAdminConfigProvider` instead. */
export const AdminConfigProvider = ClientAdminConfigProvider
