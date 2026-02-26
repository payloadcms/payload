'use client'
import type { ClientAdminConfig, RscAdminConfig } from 'payload'

import { createContext, use } from 'react'

const ClientAdminConfigContext = createContext<ClientAdminConfig>({})
const RscAdminConfigContext = createContext<RscAdminConfig>({})
const RscSchemaPathsContext = createContext<string[]>([])

export const ClientAdminConfigProvider: React.FC<{
  readonly children: React.ReactNode
  readonly config: ClientAdminConfig
}> = ({ children, config }) => {
  return <ClientAdminConfigContext value={config}>{children}</ClientAdminConfigContext>
}

export const RscAdminConfigProvider: React.FC<{
  readonly children: React.ReactNode
  readonly config: RscAdminConfig
}> = ({ children, config }) => {
  return <RscAdminConfigContext value={config}>{children}</RscAdminConfigContext>
}

export const RscSchemaPathsProvider: React.FC<{
  readonly children: React.ReactNode
  readonly paths: string[]
}> = ({ children, paths }) => {
  return <RscSchemaPathsContext value={paths}>{children}</RscSchemaPathsContext>
}

export const useClientAdminConfig = (): ClientAdminConfig => use(ClientAdminConfigContext)
export const useRscAdminConfig = (): RscAdminConfig => use(RscAdminConfigContext)
export const useRscSchemaPaths = (): string[] => use(RscSchemaPathsContext)
