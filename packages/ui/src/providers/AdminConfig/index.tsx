'use client'
import type { AdminConfig } from 'payload'

import { createContext, use } from 'react'

const AdminConfigContext = createContext<AdminConfig>({})

export const AdminConfigProvider: React.FC<{
  readonly adminConfig: AdminConfig
  readonly children: React.ReactNode
}> = ({ adminConfig, children }) => {
  return <AdminConfigContext value={adminConfig}>{children}</AdminConfigContext>
}

export const useAdminConfig = (): AdminConfig => use(AdminConfigContext)
