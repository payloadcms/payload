'use client'

import React, { createContext, use } from 'react'

const AdminValidateErrorsContext = createContext<Map<string, string> | null>(null)

export type AdminValidateErrorsProviderProps = {
  children: React.ReactNode
  errors: Map<string, string>
}

export function AdminValidateErrorsProvider({
  children,
  errors,
}: AdminValidateErrorsProviderProps) {
  return <AdminValidateErrorsContext value={errors}>{children}</AdminValidateErrorsContext>
}

export function useAdminValidateErrors(): Map<string, string> {
  const ctx = use(AdminValidateErrorsContext)
  if (!ctx) {
    throw new Error('useAdminValidateErrors must be used within AdminValidateErrorsProvider')
  }
  return ctx
}

export function useAdminValidateError(path: string): string | undefined {
  const ctx = use(AdminValidateErrorsContext)
  if (!ctx) {
    return undefined
  }
  return ctx.get(path)
}
